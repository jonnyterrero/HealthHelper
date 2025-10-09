# Health AI Backend

Python backend for the Health Helper app providing AI-powered health predictions, pattern analysis, and personalized recommendations.

## Features

- **Unified Health Database**: SQLite-based storage for health data from multiple sources
- **Feature Store**: Materialized feature engineering for ML models
- **ML Models**: Tabular and sequence-based models for health predictions
- **FastAPI Server**: REST API for health data ingestion and predictions
- **Sleep & Stress AI**: Advanced sleep quality prediction and stress management
- **Nutrition & Symptoms AI**: Food-symptom correlation analysis and remedy recommendations

## Setup

### 1. Install Python Dependencies

```bash
cd python-backend
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
python unified_health_ai.py
```

This creates the SQLite database with all necessary tables.

### 3. Run the API Server

```bash
python api_server.py
```

Or use uvicorn directly:

```bash
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 4. API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check

### Data Ingestion
- `POST /data/ingest` - Ingest health data (daily logs, symptoms, meals, sleep, workouts, vitals, journals)

### Feature Store
- `POST /features/rebuild` - Rebuild features for a user and date range
- `GET /features/{user_id}/{date}` - Get features for a specific date

### Predictions
- `POST /predict/daily` - Get daily risk predictions (gut, skin, mood, stress)
- `POST /predict/sequence` - Get sequence-based risk predictions

### Model Training
- `POST /models/train` - Train models for a user (background task)
- `GET /models/{user_id}/status` - Get model training status

### Analytics
- `GET /analytics/{user_id}/summary` - Get user health summary
- `GET /analytics/{user_id}/trends` - Get health trends

## Example Usage

### 1. Ingest Daily Health Data

```python
import requests

# Daily log
response = requests.post("http://localhost:8000/data/ingest", json={
    "user_id": "user_001",
    "data_type": "daily_log",
    "data": {
        "date": "2025-01-15",
        "mood": 7,
        "stress": 4,
        "energy": 8,
        "focus": 7,
        "notes": "Feeling good today"
    }
})
print(response.json())
```

### 2. Rebuild Features

```python
response = requests.post("http://localhost:8000/features/rebuild", json={
    "user_id": "user_001",
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
})
print(response.json())
```

### 3. Train Models

```python
response = requests.post("http://localhost:8000/models/train", json={
    "user_id": "user_001",
    "targets": ["gut", "skin", "mood", "stress"]
})
print(response.json())
```

### 4. Get Predictions

```python
response = requests.post("http://localhost:8000/predict/daily", json={
    "user_id": "user_001",
    "date": "2025-01-15"
})
predictions = response.json()
print(f"Risk predictions: {predictions['predictions']}")
print(f"Recommendations: {predictions['recommendations']}")
```

## Architecture

```
python-backend/
├── unified_health_ai.py      # Core database schema and models
├── feature_store.py           # Feature engineering and storage
├── ml_models.py               # ML models (classifiers, LSTM)
├── api_server.py              # FastAPI REST API server
├── sleep_stress_ai.py         # Sleep and stress analysis
├── nutrition_symptoms_ai.py   # Nutrition and symptom analysis
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Data Flow

1. **Data Ingestion** → Health data from Next.js app via REST API
2. **Feature Engineering** → Raw data transformed into ML features
3. **Model Training** → Train personalized models for each user
4. **Predictions** → Generate daily risk scores and recommendations
5. **Frontend Integration** → Results sent back to Next.js app

## Models

### Tabular Models (Gradient Boosting)
- Predict next-day risk for gut, skin, mood, and stress
- Uses rolling features, lag features, and derived metrics
- Time-series cross-validation for robust evaluation

### Sequence Models (LSTM)
- Analyze 14-day sequences for temporal patterns
- Captures long-term dependencies in health data
- Multi-task learning for multiple health targets

## Development

### Testing

```bash
pytest
```

### Code Structure

- **Pydantic Models**: Input validation and type safety
- **SQLite Database**: Lightweight, file-based storage
- **Feature Store**: Materialized views for fast predictions
- **Background Tasks**: Async model training without blocking API

## Integration with Next.js

The Python backend is designed to work with the Next.js Health Helper app. The Next.js app should:

1. Send health data to `/data/ingest` endpoint
2. Trigger feature rebuilds after data ingestion
3. Request predictions via `/predict/daily` endpoint
4. Display AI insights and recommendations to users

See the Next.js integration guide in the main README for details.

## Performance

- **Data Ingestion**: < 100ms per request
- **Feature Rebuild**: 1-5 seconds for 30 days of data
- **Predictions**: < 200ms per request
- **Model Training**: 2-10 minutes (background task)

## Security Considerations

For production deployment:

1. Add authentication/authorization (JWT tokens, API keys)
2. Configure CORS properly (restrict origins)
3. Use environment variables for sensitive config
4. Enable HTTPS/TLS
5. Implement rate limiting
6. Add input sanitization and validation
7. Use proper database connection pooling

## License

MIT License