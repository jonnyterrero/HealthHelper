"""
Sleep & Stress AI Analysis
========================
Advanced AI features for sleep quality prediction and stress management
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json

class SleepStressAI:
    """AI-powered sleep and stress analysis."""
    
    def __init__(self):
        self.sleep_models = {}
        self.stress_models = {}
    
    def analyze_sleep_patterns(self, sleep_data: List[Dict]) -> Dict[str, Any]:
        """Analyze sleep patterns and provide insights."""
        if not sleep_data:
            return {"error": "No sleep data available"}
        
        df = pd.DataFrame(sleep_data)
        
        # Calculate sleep metrics
        avg_duration = df['duration_hours'].mean() if 'duration_hours' in df else 0
        avg_quality = df['quality_score'].mean() if 'quality_score' in df else 0
        consistency = 1 - df['duration_hours'].std() / df['duration_hours'].mean() if 'duration_hours' in df and df['duration_hours'].mean() > 0 else 0
        
        # Sleep stage analysis
        deep_sleep_avg = df['deep_sleep_percent'].mean() if 'deep_sleep_percent' in df else 0
        rem_sleep_avg = df['rem_sleep_percent'].mean() if 'rem_sleep_percent' in df else 0
        
        # Identify patterns
        patterns = {
            'sleep_debt': max(0, 8 - avg_duration),
            'quality_trend': self._calculate_trend(df['quality_score']) if 'quality_score' in df else "insufficient_data",
            'consistency_score': consistency,
            'deep_sleep_sufficiency': deep_sleep_avg >= 20,
            'rem_sleep_sufficiency': rem_sleep_avg >= 20
        }
        
        # Generate recommendations
        recommendations = self._generate_sleep_recommendations(patterns, df)
        
        return {
            'metrics': {
                'avg_duration': avg_duration,
                'avg_quality': avg_quality,
                'consistency': consistency,
                'deep_sleep_avg': deep_sleep_avg,
                'rem_sleep_avg': rem_sleep_avg
            },
            'patterns': patterns,
            'recommendations': recommendations,
            'risk_factors': self._identify_sleep_risk_factors(df)
        }
    
    def predict_sleep_quality(self, current_factors: Dict[str, Any]) -> Dict[str, Any]:
        """Predict sleep quality based on current factors."""
        # Feature engineering
        features = self._extract_sleep_features(current_factors)
        
        # Simple rule-based prediction (can be replaced with ML model)
        base_score = 7.0
        
        # Adjust for duration
        if features['duration_hours'] < 6:
            base_score -= 2
        elif features['duration_hours'] > 9:
            base_score -= 1
        
        # Adjust for factors
        if features.get('caffeine_afternoon', False):
            base_score -= 1.5
        if features.get('alcohol_evening', False):
            base_score -= 1
        if features.get('screen_time_late', False):
            base_score -= 1
        if features.get('stress_level', 5) > 7:
            base_score -= 1.5
        if features.get('exercise_late', False):
            base_score -= 0.5
        
        # Adjust for positive factors
        if features.get('exercise_early', False):
            base_score += 0.5
        if features.get('meditation', False):
            base_score += 0.5
        if features.get('consistent_bedtime', True):
            base_score += 1
        
        predicted_quality = max(1, min(10, base_score))
        
        return {
            'predicted_quality': predicted_quality,
            'confidence': 0.8,
            'risk_factors': self._get_sleep_risk_factors(features),
            'recommendations': self._get_sleep_recommendations(features)
        }
    
    def analyze_stress_patterns(self, stress_data: List[Dict]) -> Dict[str, Any]:
        """Analyze stress patterns and provide management insights."""
        if not stress_data:
            return {"error": "No stress data available"}
        
        df = pd.DataFrame(stress_data)
        
        # Calculate stress metrics
        avg_stress = df['stress_level'].mean()
        stress_volatility = df['stress_level'].std()
        high_stress_days = (df['stress_level'] > 7).sum()
        
        # Identify stress triggers
        triggers = self._identify_stress_triggers(df)
        
        # Analyze coping strategies effectiveness
        coping_effectiveness = self._analyze_coping_strategies(df)
        
        return {
            'metrics': {
                'avg_stress': avg_stress,
                'volatility': stress_volatility,
                'high_stress_days': high_stress_days,
                'stress_trend': self._calculate_trend(df['stress_level'])
            },
            'triggers': triggers,
            'coping_effectiveness': coping_effectiveness,
            'recommendations': self._generate_stress_recommendations(df)
        }
    
    def predict_stress_risk(self, current_factors: Dict[str, Any]) -> Dict[str, Any]:
        """Predict stress risk based on current factors."""
        features = self._extract_stress_features(current_factors)
        
        # Calculate stress risk score
        risk_score = 0.5  # Base risk
        
        # Adjust for factors
        if features.get('work_pressure', 5) > 7:
            risk_score += 0.2
        if features.get('sleep_quality', 7) < 5:
            risk_score += 0.3
        if features.get('social_support', 5) < 4:
            risk_score += 0.2
        if features.get('physical_activity', 5) < 3:
            risk_score += 0.1
        if features.get('recent_stress_events', 0) > 0:
            risk_score += 0.2
        
        # Adjust for protective factors
        if features.get('meditation_practice', False):
            risk_score -= 0.2
        if features.get('exercise_regular', False):
            risk_score -= 0.1
        if features.get('social_connections', 5) > 6:
            risk_score -= 0.1
        
        risk_score = max(0, min(1, risk_score))
        
        return {
            'stress_risk': risk_score,
            'confidence': 0.75,
            'risk_factors': self._get_stress_risk_factors(features),
            'preventive_actions': self._get_stress_preventive_actions(features)
        }
    
    def _extract_sleep_features(self, factors: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features for sleep prediction."""
        return {
            'duration_hours': factors.get('duration_hours', 8),
            'caffeine_afternoon': factors.get('caffeine_afternoon', False),
            'alcohol_evening': factors.get('alcohol_evening', False),
            'screen_time_late': factors.get('screen_time_late', False),
            'stress_level': factors.get('stress_level', 5),
            'exercise_late': factors.get('exercise_late', False),
            'exercise_early': factors.get('exercise_early', False),
            'meditation': factors.get('meditation', False),
            'consistent_bedtime': factors.get('consistent_bedtime', True),
            'room_temperature': factors.get('room_temperature', 20),
            'noise_level': factors.get('noise_level', 3)
        }
    
    def _extract_stress_features(self, factors: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features for stress prediction."""
        return {
            'work_pressure': factors.get('work_pressure', 5),
            'sleep_quality': factors.get('sleep_quality', 7),
            'social_support': factors.get('social_support', 5),
            'physical_activity': factors.get('physical_activity', 5),
            'recent_stress_events': factors.get('recent_stress_events', 0),
            'meditation_practice': factors.get('meditation_practice', False),
            'exercise_regular': factors.get('exercise_regular', False),
            'social_connections': factors.get('social_connections', 5),
            'financial_stress': factors.get('financial_stress', 3),
            'relationship_stress': factors.get('relationship_stress', 3)
        }
    
    def _calculate_trend(self, series: pd.Series) -> str:
        """Calculate trend direction."""
        if len(series) < 2:
            return "insufficient_data"
        
        recent = series.tail(3).mean()
        earlier = series.head(3).mean()
        
        if recent > earlier + 0.5:
            return "improving"
        elif recent < earlier - 0.5:
            return "declining"
        else:
            return "stable"
    
    def _generate_sleep_recommendations(self, patterns: Dict, df: pd.DataFrame) -> List[str]:
        """Generate personalized sleep recommendations."""
        recommendations = []
        
        if patterns['sleep_debt'] > 1:
            recommendations.append("Consider going to bed 30 minutes earlier to reduce sleep debt")
        
        if not patterns['consistency_score'] > 0.8:
            recommendations.append("Try to maintain a consistent sleep schedule, even on weekends")
        
        if not patterns['deep_sleep_sufficiency']:
            recommendations.append("Avoid caffeine after 2 PM and create a cool, dark sleep environment")
        
        if not patterns['rem_sleep_sufficiency']:
            recommendations.append("Ensure adequate sleep duration and avoid alcohol before bed")
        
        return recommendations
    
    def _identify_sleep_risk_factors(self, df: pd.DataFrame) -> List[str]:
        """Identify sleep risk factors."""
        risk_factors = []
        
        if 'duration_hours' in df and df['duration_hours'].mean() < 6:
            risk_factors.append("Insufficient sleep duration")
        
        if 'quality_score' in df and df['quality_score'].mean() < 6:
            risk_factors.append("Poor sleep quality")
        
        if 'duration_hours' in df and df['duration_hours'].std() > 2:
            risk_factors.append("Irregular sleep schedule")
        
        return risk_factors
    
    def _get_sleep_risk_factors(self, features: Dict[str, Any]) -> List[str]:
        """Get current sleep risk factors."""
        factors = []
        
        if features['duration_hours'] < 6:
            factors.append("Short sleep duration")
        if features.get('caffeine_afternoon', False):
            factors.append("Late caffeine consumption")
        if features.get('screen_time_late', False):
            factors.append("Late screen time")
        if features['stress_level'] > 7:
            factors.append("High stress levels")
        
        return factors
    
    def _get_sleep_recommendations(self, features: Dict[str, Any]) -> List[str]:
        """Get personalized sleep recommendations."""
        recommendations = []
        
        if features['duration_hours'] < 7:
            recommendations.append("Aim for 7-9 hours of sleep per night")
        
        if features.get('caffeine_afternoon', False):
            recommendations.append("Avoid caffeine after 2 PM")
        
        if features.get('screen_time_late', False):
            recommendations.append("Stop using screens 1 hour before bed")
        
        if features['stress_level'] > 7:
            recommendations.append("Practice relaxation techniques before bed")
        
        return recommendations
    
    def _identify_stress_triggers(self, df: pd.DataFrame) -> Dict[str, float]:
        """Identify stress triggers from data."""
        triggers = {}
        
        # Simple correlation analysis
        for col in df.columns:
            if col != 'stress_level' and df[col].dtype in ['int64', 'float64']:
                corr = df['stress_level'].corr(df[col])
                if abs(corr) > 0.3:
                    triggers[col] = corr
        
        return triggers
    
    def _analyze_coping_strategies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze effectiveness of coping strategies."""
        # This would analyze the relationship between coping strategies and stress reduction
        return {
            'meditation': 0.7,
            'exercise': 0.8,
            'social_support': 0.6,
            'breathing_exercises': 0.5
        }
    
    def _generate_stress_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Generate stress management recommendations."""
        recommendations = []
        
        if df['stress_level'].mean() > 7:
            recommendations.append("Consider regular meditation or mindfulness practice")
        
        if 'physical_activity' in df and df['physical_activity'].mean() < 4:
            recommendations.append("Increase physical activity to reduce stress")
        
        if 'social_support' in df and df['social_support'].mean() < 5:
            recommendations.append("Strengthen social connections and support network")
        
        return recommendations
    
    def _get_stress_risk_factors(self, features: Dict[str, Any]) -> List[str]:
        """Get current stress risk factors."""
        factors = []
        
        if features['work_pressure'] > 7:
            factors.append("High work pressure")
        if features['sleep_quality'] < 5:
            factors.append("Poor sleep quality")
        if features['social_support'] < 4:
            factors.append("Low social support")
        if features['recent_stress_events'] > 0:
            factors.append("Recent stressful events")
        
        return factors
    
    def _get_stress_preventive_actions(self, features: Dict[str, Any]) -> List[str]:
        """Get preventive actions for stress management."""
        actions = []
        
        if features['work_pressure'] > 7:
            actions.append("Set boundaries and prioritize tasks")
        
        if features['sleep_quality'] < 5:
            actions.append("Improve sleep hygiene and routine")
        
        if features['social_support'] < 4:
            actions.append("Reach out to friends and family")
        
        if not features['meditation_practice']:
            actions.append("Start a daily meditation practice")
        
        return actions