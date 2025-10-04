"""
ML Models Implementation
======================
Multi-task sequence models and trigger classifiers for health AI
"""

import json
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import joblib
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, brier_score_loss, classification_report

from unified_health_ai import get_conn, ROLL_DAYS, SEQ_LEN, BATCH_SIZE, LEARNING_RATE, EPOCHS

##############################
# 1) SEQUENCE DATASET        #
##############################

class HealthSequenceDataset(Dataset):
    """Dataset for health sequence data."""
    
    def __init__(self, sequences: List[Dict[str, Any]], target: str = "gut"):
        self.sequences = sequences
        self.target = target
        
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        seq = self.sequences[idx]
        X = torch.FloatTensor(seq['X'])
        y = torch.FloatTensor([seq['Y'].get(f'y_{self.target}_next', 0)])
        return X, y

##############################
# 2) LSTM MODEL             #
##############################

class HealthLSTM(nn.Module):
    """LSTM model for health predictions."""
    
    def __init__(self, input_dim: int, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.3):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        # x: [batch, seq_len, features]
        lstm_out, (h_n, c_n) = self.lstm(x)
        # Use last hidden state
        out = self.fc(h_n[-1])
        return out

##############################
# 3) MODEL TRAINER          #
##############################

class HealthModelTrainer:
    """Train and evaluate health prediction models."""
    
    def __init__(self):
        self.models = {}
    
    def train_trigger_classifiers(self, user_id: str) -> Dict[str, Any]:
        """Train trigger-based classifiers for each health target."""
        with get_conn() as conn:
            df = pd.read_sql_query(
                """SELECT date, features_json, labels_json 
                   FROM fs_daily_user 
                   WHERE user_id=? 
                   ORDER BY date""",
                conn, params=[user_id]
            )
        
        if df.empty or len(df) < 30:
            print(f"⚠ Insufficient data for user {user_id}")
            return {}
        
        # Parse features and labels
        features_list = df['features_json'].apply(json.loads).tolist()
        labels_list = df['labels_json'].apply(json.loads).tolist()
        
        # Convert to arrays
        X = np.array([list(f.values()) for f in features_list])
        
        models = {}
        targets = ['gut', 'skin', 'mood', 'stress']
        
        for target in targets:
            y_key = f'y_{target}_next'
            y = np.array([l.get(y_key, 0) for l in labels_list])
            
            # Skip if insufficient positive samples
            if y.sum() < 5:
                continue
            
            # Time series split
            tscv = TimeSeriesSplit(n_splits=3)
            
            best_model = None
            best_score = 0
            
            for train_idx, test_idx in tscv.split(X):
                X_train, X_test = X[train_idx], X[test_idx]
                y_train, y_test = y[train_idx], y[test_idx]
                
                # Train model
                pipeline = Pipeline([
                    ('scaler', StandardScaler()),
                    ('classifier', GradientBoostingClassifier(
                        n_estimators=100,
                        max_depth=4,
                        learning_rate=0.1,
                        random_state=42
                    ))
                ])
                
                pipeline.fit(X_train, y_train)
                
                # Evaluate
                if len(np.unique(y_test)) > 1:
                    score = roc_auc_score(y_test, pipeline.predict_proba(X_test)[:, 1])
                    if score > best_score:
                        best_score = score
                        best_model = pipeline
            
            if best_model:
                models[f'classifier_{target}'] = best_model
                print(f"✅ Trained {target} classifier (AUC: {best_score:.3f})")
        
        return models
    
    def train_sequence_model(self, user_id: str, target: str = "gut") -> Optional[nn.Module]:
        """Train LSTM sequence model for a specific target."""
        with get_conn() as conn:
            df = pd.read_sql_query(
                """SELECT date, seq_json 
                   FROM fs_seq_user 
                   WHERE user_id=? 
                   ORDER BY date""",
                conn, params=[user_id]
            )
        
        if df.empty or len(df) < 20:
            print(f"⚠ Insufficient sequence data for user {user_id}")
            return None
        
        # Parse sequences
        sequences = [json.loads(row['seq_json']) for _, row in df.iterrows()]
        
        # Split train/val
        split_idx = int(len(sequences) * 0.8)
        train_seqs = sequences[:split_idx]
        val_seqs = sequences[split_idx:]
        
        # Create datasets
        train_dataset = HealthSequenceDataset(train_seqs, target)
        val_dataset = HealthSequenceDataset(val_seqs, target)
        
        train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)
        
        # Get input dimension
        sample_x, _ = train_dataset[0]
        input_dim = sample_x.shape[1]
        
        # Create model
        model = HealthLSTM(input_dim)
        criterion = nn.BCELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
        
        # Train
        best_val_loss = float('inf')
        patience = 3
        patience_counter = 0
        
        for epoch in range(EPOCHS):
            # Training
            model.train()
            train_loss = 0
            for X_batch, y_batch in train_loader:
                optimizer.zero_grad()
                outputs = model(X_batch)
                loss = criterion(outputs, y_batch)
                loss.backward()
                optimizer.step()
                train_loss += loss.item()
            
            # Validation
            model.eval()
            val_loss = 0
            with torch.no_grad():
                for X_batch, y_batch in val_loader:
                    outputs = model(X_batch)
                    loss = criterion(outputs, y_batch)
                    val_loss += loss.item()
            
            avg_train_loss = train_loss / len(train_loader)
            avg_val_loss = val_loss / len(val_loader)
            
            print(f"Epoch {epoch+1}/{EPOCHS} - Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}")
            
            # Early stopping
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping at epoch {epoch+1}")
                    break
        
        print(f"✅ Trained {target} sequence model")
        return model
    
    def save_models(self, user_id: str, models: Dict[str, Any]) -> None:
        """Save models to disk."""
        model_dir = Path("models") / user_id
        model_dir.mkdir(parents=True, exist_ok=True)
        
        for name, model in models.items():
            if isinstance(model, nn.Module):
                # Save PyTorch model
                torch.save(model.state_dict(), model_dir / f"{name}.pth")
            else:
                # Save sklearn model
                joblib.dump(model, model_dir / f"{name}.pkl")
        
        print(f"✅ Models saved to {model_dir}")
    
    def load_models(self, user_id: str) -> Dict[str, Any]:
        """Load models from disk."""
        model_dir = Path("models") / user_id
        if not model_dir.exists():
            return {}
        
        models = {}
        
        # Load sklearn models
        for pkl_file in model_dir.glob("*.pkl"):
            models[pkl_file.stem] = joblib.load(pkl_file)
        
        # Load PyTorch models
        for pth_file in model_dir.glob("*.pth"):
            # Note: Need to know input_dim to load LSTM
            # For now, just save the path
            models[pth_file.stem] = str(pth_file)
        
        return models

##############################
# 4) PREDICTION ENGINE      #
##############################

class HealthPredictionEngine:
    """Generate predictions using trained models."""
    
    def __init__(self):
        self.models = {}
    
    def load_models(self, user_id: str) -> None:
        """Load models for a user."""
        trainer = HealthModelTrainer()
        self.models = trainer.load_models(user_id)
    
    def predict_daily_risk(self, user_id: str, date: str) -> Dict[str, float]:
        """Predict daily risk scores for all targets."""
        from feature_store import FeatureStore
        
        fs = FeatureStore()
        features = fs.get_daily_features(user_id, date)
        
        if not features:
            return {}
        
        X = np.array([list(features['features'].values())])
        
        predictions = {}
        targets = ['gut', 'skin', 'mood', 'stress']
        
        for target in targets:
            model_name = f'classifier_{target}'
            if model_name in self.models:
                model = self.models[model_name]
                pred_proba = model.predict_proba(X)[0, 1]
                predictions[target] = float(pred_proba)
        
        return predictions
    
    def predict_sequence_risk(self, user_id: str, date: str) -> Dict[str, float]:
        """Predict risk using sequence models."""
        from feature_store import FeatureStore
        
        fs = FeatureStore()
        seq_features = fs.get_sequence_features(user_id, date)
        
        if not seq_features:
            return {}
        
        X = torch.FloatTensor(seq_features['X']).unsqueeze(0)  # Add batch dimension
        
        predictions = {}
        targets = ['gut', 'skin', 'mood', 'stress']
        
        for target in targets:
            model_name = f'sequence_{target}'
            if model_name in self.models:
                model_path = self.models[model_name]
                # Load and predict (simplified)
                # In production, cache loaded models
                predictions[target] = 0.5  # Placeholder
        
        return predictions
    
    def get_explanations(self, user_id: str, date: str) -> Dict[str, Dict[str, float]]:
        """Get feature importance explanations."""
        from feature_store import FeatureStore
        
        fs = FeatureStore()
        features = fs.get_daily_features(user_id, date)
        
        if not features:
            return {}
        
        explanations = {}
        targets = ['gut', 'skin', 'mood', 'stress']
        
        for target in targets:
            model_name = f'classifier_{target}'
            if model_name in self.models:
                model = self.models[model_name]
                
                # Get feature importances
                if hasattr(model.named_steps['classifier'], 'feature_importances_'):
                    importances = model.named_steps['classifier'].feature_importances_
                    feature_names = list(features['features'].keys())
                    
                    # Top 5 features
                    top_indices = np.argsort(importances)[-5:][::-1]
                    explanations[target] = {
                        feature_names[i]: float(importances[i])
                        for i in top_indices
                    }
        
        return explanations