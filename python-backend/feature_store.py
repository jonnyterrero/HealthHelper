"""
Feature Store Implementation
========================
Materialized feature engineering for health AI system
"""

import json
import math
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import sqlite3
from pathlib import Path

from unified_health_ai import get_conn, ROLL_DAYS, SEQ_LEN

class FeatureStore:
    """Feature store for materialized health features."""
    
    def __init__(self, db_path: str = "unified_health.db"):
        self.db_path = db_path
    
    def build_daily_features(self, user_id: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Build daily tabular features for a user."""
        with get_conn() as conn:
            # Pull all source data
            meals = pd.read_sql_query(
                """SELECT date(ts) as date, 
                          SUM(caffeine_mg) AS caffeine, 
                          COUNT(*) AS meals_cnt,
                          AVG(calories) AS avg_calories,
                          SUM(protein_g) AS total_protein,
                          SUM(carbs_g) AS total_carbs,
                          SUM(fat_g) AS total_fat,
                          SUM(fiber_g) AS total_fiber,
                          SUM(sugar_g) AS total_sugar
                   FROM meals 
                   WHERE user_id=? 
                   GROUP BY date(ts)""", 
                conn, params=[user_id]
            )
            
            sleep = pd.read_sql_query(
                """SELECT date(end_time) as date, 
                          SUM(total_min) AS sleep_min, 
                          AVG(sleep_score) as sleep_score,
                          SUM(deep_min) AS deep_min,
                          SUM(rem_min) AS rem_min,
                          AVG(awakenings) AS avg_awakenings
                   FROM sleep_sessions 
                   WHERE user_id=? 
                   GROUP BY date(end_time)""", 
                conn, params=[user_id]
            )
            
            vitals = pd.read_sql_query(
                """SELECT date, hrv_ms, steps, hr_mean, hr_max, spo2, active_min, calories_burned 
                   FROM vitals 
                   WHERE user_id=?""", 
                conn, params=[user_id]
            )
            
            daily_logs = pd.read_sql_query(
                """SELECT date, mood, stress, energy, focus 
                   FROM daily_logs 
                   WHERE user_id=?""", 
                conn, params=[user_id]
            )
            
            symptoms = pd.read_sql_query(
                """SELECT date, type, MAX(severity) AS max_severity
                   FROM symptoms 
                   WHERE user_id=? 
                   GROUP BY date, type""", 
                conn, params=[user_id]
            )
            
            workouts = pd.read_sql_query(
                """SELECT date(ts) as date, 
                          COUNT(*) AS workout_count,
                          SUM(duration_min) AS total_workout_min,
                          AVG(intensity) AS avg_intensity,
                          SUM(calories_burned) AS workout_calories
                   FROM workouts 
                   WHERE user_id=? 
                   GROUP BY date(ts)""", 
                conn, params=[user_id]
            )
            
            # Pivot symptoms by type
            symptoms_pivot = symptoms.pivot_table(
                index='date', columns='type', values='max_severity', fill_value=0
            ).reset_index() if not symptoms.empty else pd.DataFrame({'date': []})
            
            # Create date range
            date_range = pd.date_range(start_date, end_date, freq='D')
            df = pd.DataFrame({'date': date_range.date})
            df['date'] = df['date'].astype(str)
            
            # Merge all data
            for data, cols in [
                (meals, ['caffeine', 'meals_cnt', 'avg_calories', 'total_protein', 'total_carbs', 'total_fat', 'total_fiber', 'total_sugar']),
                (sleep, ['sleep_min', 'sleep_score', 'deep_min', 'rem_min', 'avg_awakenings']),
                (vitals, ['hrv_ms', 'steps', 'hr_mean', 'hr_max', 'spo2', 'active_min', 'calories_burned']),
                (daily_logs, ['mood', 'stress', 'energy', 'focus']),
                (symptoms_pivot, [col for col in symptoms_pivot.columns if col != 'date']),
                (workouts, ['workout_count', 'total_workout_min', 'avg_intensity', 'workout_calories'])
            ]:
                if not data.empty:
                    data = data.copy()
                    data['date'] = data['date'].astype(str)
                    df = df.merge(data[['date'] + [col for col in cols if col in data.columns]], on='date', how='left')
            
            # Fill missing values with sensible defaults
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(0)
            
            # Add rolling features
            df = self._add_rolling_features(df)
            
            # Add lag features
            df = self._add_lag_features(df)
            
            # Add derived features
            df = self._add_derived_features(df)
            
            # Add labels for next-day prediction
            df = self._add_labels(df)
            
            return df
    
    def _add_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add rolling window features."""
        rolling_cols = ['caffeine', 'sleep_min', 'sleep_score', 'hrv_ms', 'steps', 
                       'mood', 'stress', 'energy', 'focus', 'workout_count']
        
        for col in rolling_cols:
            if col in df.columns:
                # Rolling mean and std
                df[f'{col}_rmean_{ROLL_DAYS}'] = df[col].rolling(ROLL_DAYS, min_periods=1).mean()
                df[f'{col}_rstd_{ROLL_DAYS}'] = df[col].rolling(ROLL_DAYS, min_periods=1).std().fillna(0)
                
                # Rolling min/max
                df[f'{col}_rmin_{ROLL_DAYS}'] = df[col].rolling(ROLL_DAYS, min_periods=1).min()
                df[f'{col}_rmax_{ROLL_DAYS}'] = df[col].rolling(ROLL_DAYS, min_periods=1).max()
        
        return df
    
    def _add_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add lag features."""
        lag_cols = ['mood', 'stress', 'sleep_score', 'caffeine', 'workout_count']
        
        for col in lag_cols:
            if col in df.columns:
                df[f'{col}_lag1'] = df[col].shift(1)
                df[f'{col}_lag2'] = df[col].shift(2)
                df[f'{col}_lag3'] = df[col].shift(3)
        
        return df
    
    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived features."""
        # Sleep efficiency
        if 'sleep_min' in df.columns and 'avg_awakenings' in df.columns:
            df['sleep_efficiency'] = df['sleep_min'] / (df['sleep_min'] + df['avg_awakenings'] * 10)
            df['sleep_efficiency'] = df['sleep_efficiency'].fillna(0).clip(0, 1)
        
        # Caffeine timing (simplified)
        if 'caffeine' in df.columns:
            df['caffeine_afternoon'] = df['caffeine'] * 0.7
            df['caffeine_evening'] = df['caffeine'] * 0.3
        
        # Stress-sleep interaction
        if 'stress' in df.columns and 'sleep_score' in df.columns:
            df['stress_sleep_interaction'] = df['stress'] * (10 - df['sleep_score'])
        
        # Exercise intensity
        if 'total_workout_min' in df.columns and 'avg_intensity' in df.columns:
            df['exercise_load'] = df['total_workout_min'] * df['avg_intensity']
        
        # HRV recovery
        if 'hrv_ms' in df.columns:
            df['hrv_recovery'] = df['hrv_ms'] / df['hrv_ms'].rolling(7, min_periods=1).mean()
            df['hrv_recovery'] = df['hrv_recovery'].fillna(1)
        
        return df
    
    def _add_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add next-day prediction labels."""
        # Binary labels for high-risk days
        if 'gut' in df.columns:
            df['y_gut_next'] = (df['gut'].shift(-1) >= 5).astype(int)
        if 'skin' in df.columns:
            df['y_skin_next'] = (df['skin'].shift(-1) >= 5).astype(int)
        if 'mood' in df.columns:
            df['y_mood_next'] = (df['mood'].shift(-1) <= 3).astype(int)  # Low mood
        if 'stress' in df.columns:
            df['y_stress_next'] = (df['stress'].shift(-1) >= 8).astype(int)  # High stress
        
        return df
    
    def persist_daily_features(self, user_id: str, df: pd.DataFrame) -> None:
        """Persist daily features to database."""
        with get_conn() as conn:
            for _, row in df.iterrows():
                # Extract features (exclude labels and date)
                feature_cols = [col for col in df.columns 
                              if not col.startswith('y_') and col != 'date']
                features = row[feature_cols].to_dict()
                
                # Extract labels
                label_cols = [col for col in df.columns if col.startswith('y_')]
                labels = {col: int(row[col]) if not pd.isna(row[col]) else None 
                         for col in label_cols}
                
                conn.execute(
                    """INSERT OR REPLACE INTO fs_daily_user (user_id, date, features_json, labels_json)
                       VALUES (?, ?, ?, ?)""",
                    (user_id, row['date'], json.dumps(features), json.dumps(labels))
                )
    
    def build_sequence_features(self, user_id: str, start_date: str, end_date: str, 
                              seq_len: int = SEQ_LEN) -> List[Dict[str, Any]]:
        """Build sequence features for deep learning models."""
        with get_conn() as conn:
            df = pd.read_sql_query(
                """SELECT date, features_json, labels_json 
                   FROM fs_daily_user 
                   WHERE user_id=? AND date BETWEEN ? AND ? 
                   ORDER BY date""",
                conn, params=[user_id, start_date, end_date]
            )
        
        if df.empty:
            return []
        
        # Parse features and labels
        features_list = df['features_json'].apply(json.loads).tolist()
        labels_list = df['labels_json'].apply(json.loads).tolist()
        
        # Convert to numpy arrays
        X = np.array([list(f.values()) for f in features_list], dtype=np.float32)
        dates = pd.to_datetime(df['date']).dt.date.tolist()
        
        # Create sequences
        sequences = []
        for i in range(len(X) - seq_len):
            x_seq = X[i:i+seq_len]
            y = labels_list[i+seq_len]
            sequences.append({
                'date': dates[i+seq_len],
                'X': x_seq.tolist(),
                'Y': y
            })
        
        return sequences
    
    def persist_sequence_features(self, user_id: str, sequences: List[Dict[str, Any]]) -> None:
        """Persist sequence features to database."""
        with get_conn() as conn:
            for seq in sequences:
                conn.execute(
                    """INSERT OR REPLACE INTO fs_seq_user (user_id, date, seq_json)
                       VALUES (?, ?, ?)""",
                    (user_id, seq['date'].isoformat(), json.dumps(seq))
                )
    
    def get_daily_features(self, user_id: str, date: str) -> Optional[Dict[str, Any]]:
        """Get daily features for a specific date."""
        with get_conn() as conn:
            result = conn.execute(
                """SELECT features_json, labels_json 
                   FROM fs_daily_user 
                   WHERE user_id=? AND date=?""",
                (user_id, date)
            ).fetchone()
            
            if result:
                return {
                    'features': json.loads(result[0]),
                    'labels': json.loads(result[1])
                }
            return None
    
    def get_sequence_features(self, user_id: str, date: str) -> Optional[Dict[str, Any]]:
        """Get sequence features for a specific date."""
        with get_conn() as conn:
            result = conn.execute(
                """SELECT seq_json 
                   FROM fs_seq_user 
                   WHERE user_id=? AND date=?""",
                (user_id, date)
            ).fetchone()
            
            if result:
                return json.loads(result[0])
            return None
    
    def rebuild_features(self, user_id: str, start_date: str, end_date: str) -> None:
        """Rebuild all features for a user and date range."""
        print(f"Building features for user {user_id} from {start_date} to {end_date}")
        
        # Build daily features
        daily_df = self.build_daily_features(user_id, start_date, end_date)
        self.persist_daily_features(user_id, daily_df)
        
        # Build sequence features
        sequences = self.build_sequence_features(user_id, start_date, end_date)
        self.persist_sequence_features(user_id, sequences)
        
        print(f"✅ Features rebuilt: {len(daily_df)} daily records, {len(sequences)} sequences")