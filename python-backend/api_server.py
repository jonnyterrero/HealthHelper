"""
FastAPI Server for Health AI System
==================================
REST API for health predictions and insights
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, date
from pathlib import Path

from unified_health_ai import (
    init_db, get_conn, UserIn, DailyLogIn, SymptomIn, MealIn, 
    SleepSessionIn, WorkoutIn, VitalIn, JournalIn,
    upsert_daily_log, insert_symptom, insert_meal, insert_sleep_session,
    insert_workout, insert_vital, insert_journal
)
from feature_store import FeatureStore
from ml_models import HealthModelTrainer, HealthPredictionEngine

# Initialize FastAPI app
app = FastAPI(
    title="Health AI API",
    description="Unified health tracking with AI predictions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
feature_store = FeatureStore()
prediction_engine = HealthPredictionEngine()

# Pydantic models for API
class PredictionRequest(BaseModel):
    user_id: str
    date: str

class PredictionResponse(BaseModel):
    user_id: str
    date: str
    predictions: Dict[str, float]
    explanations: Dict[str, Dict[str, float]]
    confidence: Dict[str, float]
    recommendations: List[str]

class HealthDataRequest(BaseModel):
    user_id: str
    data_type: str  # 'daily_log', 'symptom', 'meal', 'sleep', 'workout', 'vital', 'journal'
    data: Dict[str, Any]

class HealthDataResponse(BaseModel):
    success: bool
    message: str
    data_id: Optional[int] = None

class FeatureRebuildRequest(BaseModel):
    user_id: str
    start_date: str
    end_date: str

class ModelTrainRequest(BaseModel):
    user_id: str
    targets: List[str] = ["gut", "skin", "mood", "stress"]

# API Endpoints

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print("🚀 Health AI API started!")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Health AI API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Data Ingestion Endpoints

@app.post("/data/ingest", response_model=HealthDataResponse)
async def ingest_health_data(request: HealthDataRequest):
    """Ingest health data from various sources."""
    try:
        data_id = None
        
        if request.data_type == "daily_log":
            log_data = DailyLogIn(user_id=request.user_id, **request.data)
            upsert_daily_log(log_data)
            data_id = 1  # Daily logs are upserted, not inserted
            
        elif request.data_type == "symptom":
            symptom_data = SymptomIn(user_id=request.user_id, **request.data)
            data_id = insert_symptom(symptom_data)
            
        elif request.data_type == "meal":
            meal_data = MealIn(user_id=request.user_id, **request.data)
            data_id = insert_meal(meal_data)
            
        elif request.data_type == "sleep":
            sleep_data = SleepSessionIn(user_id=request.user_id, **request.data)
            data_id = insert_sleep_session(sleep_data)
            
        elif request.data_type == "workout":
            workout_data = WorkoutIn(user_id=request.user_id, **request.data)
            data_id = insert_workout(workout_data)
            
        elif request.data_type == "vital":
            vital_data = VitalIn(user_id=request.user_id, **request.data)
            data_id = insert_vital(vital_data)
            
        elif request.data_type == "journal":
            journal_data = JournalIn(user_id=request.user_id, **request.data)
            data_id = insert_journal(journal_data)
            
        else:
            raise HTTPException(status_code=400, detail=f"Unknown data type: {request.data_type}")
        
        return HealthDataResponse(
            success=True,
            message=f"Data ingested successfully",
            data_id=data_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Feature Store Endpoints

@app.post("/features/rebuild")
async def rebuild_features(request: FeatureRebuildRequest):
    """Rebuild features for a user and date range."""
    try:
        feature_store.rebuild_features(
            request.user_id, 
            request.start_date, 
            request.end_date
        )
        return {
            "success": True,
            "message": f"Features rebuilt for user {request.user_id}",
            "date_range": f"{request.start_date} to {request.end_date}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/features/{user_id}/{date}")
async def get_features(user_id: str, date: str):
    """Get features for a specific user and date."""
    try:
        features = feature_store.get_daily_features(user_id, date)
        if features:
            return {
                "user_id": user_id,
                "date": date,
                "features": features['features'],
                "labels": features['labels']
            }
        else:
            raise HTTPException(status_code=404, detail="Features not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Prediction Endpoints

@app.post("/predict/daily", response_model=PredictionResponse)
async def predict_daily_risk(request: PredictionRequest):
    """Get daily risk predictions."""
    try:
        # Load models if not already loaded
        if not prediction_engine.models:
            prediction_engine.load_models(request.user_id)
        
        # Get predictions
        predictions = prediction_engine.predict_daily_risk(request.user_id, request.date)
        explanations = prediction_engine.get_explanations(request.user_id, request.date)
        
        # Calculate confidence (simplified)
        confidence = {target: 0.8 for target in predictions.keys()}
        
        # Generate recommendations
        recommendations = generate_recommendations(predictions, explanations)
        
        return PredictionResponse(
            user_id=request.user_id,
            date=request.date,
            predictions=predictions,
            explanations=explanations,
            confidence=confidence,
            recommendations=recommendations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/sequence")
async def predict_sequence_risk(request: PredictionRequest):
    """Get sequence-based risk predictions."""
    try:
        if not prediction_engine.models:
            prediction_engine.load_models(request.user_id)
        
        predictions = prediction_engine.predict_sequence_risk(request.user_id, request.date)
        
        return {
            "user_id": request.user_id,
            "date": request.date,
            "predictions": predictions,
            "model_type": "sequence"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Model Training Endpoints

@app.post("/models/train")
async def train_models(request: ModelTrainRequest, background_tasks: BackgroundTasks):
    """Train models for a user."""
    try:
        # Add training to background tasks
        background_tasks.add_task(
            train_user_models, 
            request.user_id, 
            request.targets
        )
        
        return {
            "success": True,
            "message": f"Model training started for user {request.user_id}",
            "targets": request.targets
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/{user_id}/status")
async def get_model_status(user_id: str):
    """Get model training status."""
    try:
        model_dir = Path("models") / user_id
        if not model_dir.exists():
            return {
                "user_id": user_id,
                "status": "no_models",
                "models": []
            }
        
        models = list(model_dir.glob("*.pkl")) + list(model_dir.glob("*.pth"))
        model_names = [model.stem for model in models]
        
        return {
            "user_id": user_id,
            "status": "trained" if model_names else "no_models",
            "models": model_names
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Endpoints

@app.get("/analytics/{user_id}/summary")
async def get_user_summary(user_id: str):
    """Get user health summary."""
    try:
        with get_conn() as conn:
            # Get recent data counts
            counts = {}
            
            # Daily logs
            daily_count = conn.execute(
                "SELECT COUNT(*) FROM daily_logs WHERE user_id=?", (user_id,)
            ).fetchone()[0]
            counts['daily_logs'] = daily_count
            
            # Symptoms
            symptom_count = conn.execute(
                "SELECT COUNT(*) FROM symptoms WHERE user_id=?", (user_id,)
            ).fetchone()[0]
            counts['symptoms'] = symptom_count
            
            # Meals
            meal_count = conn.execute(
                "SELECT COUNT(*) FROM meals WHERE user_id=?", (user_id,)
            ).fetchone()[0]
            counts['meals'] = meal_count
            
            # Sleep sessions
            sleep_count = conn.execute(
                "SELECT COUNT(*) FROM sleep_sessions WHERE user_id=?", (user_id,)
            ).fetchone()[0]
            counts['sleep_sessions'] = sleep_count
            
            # Workouts
            workout_count = conn.execute(
                "SELECT COUNT(*) FROM workouts WHERE user_id=?", (user_id,)
            ).fetchone()[0]
            counts['workouts'] = workout_count
            
            return {
                "user_id": user_id,
                "data_counts": counts,
                "last_updated": datetime.now().isoformat()
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/{user_id}/trends")
async def get_health_trends(user_id: str, days: int = 30):
    """Get health trends for a user."""
    try:
        with get_conn() as conn:
            # Get recent daily logs
            daily_logs = conn.execute(
                """SELECT date, mood, stress, energy, focus 
                   FROM daily_logs 
                   WHERE user_id=? 
                   ORDER BY date DESC 
                   LIMIT ?""",
                (user_id, days)
            ).fetchall()
            
            # Get recent symptoms
            symptoms = conn.execute(
                """SELECT date, type, severity 
                   FROM symptoms 
                   WHERE user_id=? 
                   ORDER BY date DESC 
                   LIMIT ?""",
                (user_id, days * 5)  # More symptoms per day
            ).fetchall()
            
            return {
                "user_id": user_id,
                "daily_logs": [dict(row) for row in daily_logs],
                "symptoms": [dict(row) for row in symptoms],
                "period_days": days
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper Functions

def generate_recommendations(predictions: Dict[str, float], 
                           explanations: Dict[str, Dict[str, float]]) -> List[str]:
    """Generate personalized recommendations based on predictions."""
    recommendations = []
    
    # High risk recommendations
    for target, risk in predictions.items():
        if risk > 0.7:
            if target == "gut":
                recommendations.append("Consider avoiding spicy foods and caffeine today")
            elif target == "skin":
                recommendations.append("Use gentle skincare products and avoid harsh chemicals")
            elif target == "mood":
                recommendations.append("Try relaxation techniques like meditation or deep breathing")
            elif target == "stress":
                recommendations.append("Take breaks throughout the day and practice stress management")
    
    # Low risk positive reinforcement
    low_risk_targets = [target for target, risk in predictions.items() if risk < 0.3]
    if low_risk_targets:
        recommendations.append(f"Great job! Your {', '.join(low_risk_targets)} risk is low today")
    
    return recommendations

async def train_user_models(user_id: str, targets: List[str]):
    """Background task to train models for a user."""
    try:
        trainer = HealthModelTrainer()
        
        # Train trigger classifiers
        classifiers = trainer.train_trigger_classifiers(user_id)
        
        # Train sequence models for each target
        sequence_models = {}
        for target in targets:
            model = trainer.train_sequence_model(user_id, target)
            if model:
                sequence_models[f"sequence_{target}"] = model
        
        # Save all models
        all_models = {**classifiers, **sequence_models}
        trainer.save_models(user_id, all_models)
        
        print(f"✅ Models trained for user {user_id}")
        
    except Exception as e:
        print(f"❌ Error training models for user {user_id}: {e}")

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)