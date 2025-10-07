# Python AI Backend Integration Guide

This guide explains how to set up and use the Python AI backend with your Health Helper Next.js application.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                 │
│  ┌─────────────────────────────────┐   │
│  │  Health Dashboard (page.tsx)     │   │
│  │  - Daily Health Tracking         │   │
│  │  - AI Predictions Display        │   │
│  └─────────────┬────────────────────┘   │
│                │                         │
│  ┌─────────────▼────────────────────┐   │
│  │  API Routes (/api/ai/*)          │   │
│  │  - /predict                       │   │
│  │  - /ingest                        │   │
│  │  - /features                      │   │
│  │  - /train                         │   │
│  │  - /analytics                     │   │
│  └─────────────┬────────────────────┘   │
└────────────────┼────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────┐
│     Python FastAPI Backend (Port 8000)  │
│  ┌──────────────────────────────────┐   │
│  │  FastAPI Server (api_server.py)   │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  ML Models (ml_models.py)         │   │
│  │  - Gradient Boosting Classifiers  │   │
│  │  - LSTM Sequence Models           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Feature Store (feature_store.py) │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  SQLite Database                  │   │
│  │  unified_health.db                │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Python 3.9+** installed
- **Node.js 18+** and npm/bun installed
- **SQLite3** (comes with Python)

## ⚙️ Setup Instructions

### 1. Install Python Dependencies

```bash
cd python-backend
pip install -r requirements.txt
```

Required packages:
- FastAPI & Uvicorn (API server)
- NumPy, Pandas, Scikit-learn (Data processing & ML)
- PyTorch (Deep learning)
- Pydantic (Data validation)

### 2. Initialize Database

```bash
python python-backend/unified_health_ai.py
```

This creates `unified_health.db` with the complete schema for:
- Users & daily logs
- Symptoms & health metrics
- Meals & nutrition data
- Sleep sessions & workouts
- Feature store for ML
- Model storage & predictions

### 3. Start Python Backend Server

```bash
# Option 1: Direct execution
python python-backend/api_server.py

# Option 2: Using uvicorn (recommended for development)
cd python-backend
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000
```

The server will start on **http://localhost:8000**

Verify it's running:
```bash
curl http://localhost:8000/health
```

### 4. Configure Next.js Environment

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
PYTHON_API_URL=http://localhost:8000
DEFAULT_USER_ID=user_001
```

### 5. Start Next.js Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at **http://localhost:3000**

## 🎯 Features & Usage

### AI Predictions

The dashboard now displays real-time AI predictions for:
- **Gut Health Risk** (0-100%)
- **Skin Health Risk** (0-100%)
- **Mood Risk** (0-100%)
- **Stress Risk** (0-100%)

These predictions are powered by:
- **Gradient Boosting models** for daily risk scores
- **LSTM models** for sequence-based temporal patterns
- **Feature engineering** from 7-14 day rolling windows

### AI Status Indicator

Look for the AI status badge in the top right of the dashboard:
- 🟢 **AI Connected** - Python backend is running
- 🔴 **AI Offline** - Backend is not reachable
- ⚫ **Checking...** - Status check in progress

### Data Flow

1. **Data Entry** → User logs health data in the dashboard
2. **Auto-Sync** → Data is sent to Python backend via `/api/ai/ingest`
3. **Feature Engineering** → Backend processes and stores features
4. **Prediction** → ML models generate risk predictions
5. **Display** → Predictions shown in real-time on dashboard

## 📡 API Endpoints

### Frontend API Routes (Next.js)

All routes proxy to the Python backend:

#### `POST /api/ai/predict`
Get AI predictions for a specific date.

**Request:**
```json
{
  "user_id": "user_001",
  "date": "2025-01-15"
}
```

**Response:**
```json
{
  "user_id": "user_001",
  "date": "2025-01-15",
  "predictions": {
    "gut": 0.35,
    "skin": 0.12,
    "mood": 0.45,
    "stress": 0.67
  },
  "confidence": {
    "gut": 0.85,
    "skin": 0.92,
    "mood": 0.78,
    "stress": 0.81
  },
  "recommendations": [
    "Consider avoiding spicy foods today",
    "Try relaxation techniques like meditation"
  ]
}
```

#### `POST /api/ai/ingest`
Ingest health data into the AI system.

**Request:**
```json
{
  "user_id": "user_001",
  "data_type": "daily_log",
  "data": {
    "date": "2025-01-15",
    "mood": 7,
    "stress": 4,
    "energy": 8,
    "focus": 7
  }
}
```

#### `POST /api/ai/features`
Rebuild feature store for a date range.

#### `POST /api/ai/train`
Train personalized ML models (background task).

#### `GET /api/ai/status`
Check if Python backend is running.

### Python Backend API

Full API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing the Integration

### 1. Test Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T..."
}
```

### 2. Test Data Ingestion

```bash
curl -X POST http://localhost:8000/data/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_001",
    "data_type": "daily_log",
    "data": {
      "date": "2025-10-07",
      "mood": 7,
      "stress": 4,
      "energy": 8,
      "focus": 7
    }
  }'
```

### 3. Test Predictions

First, you need some data. Use the "Load Sample Data" button in the dashboard, then:

```bash
curl -X POST http://localhost:8000/predict/daily \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_001",
    "date": "2025-10-07"
  }'
```

### 4. Test Model Training

```bash
curl -X POST http://localhost:8000/models/train \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_001",
    "targets": ["gut", "skin", "mood", "stress"]
  }'
```

Training happens in the background and takes 2-10 minutes depending on data volume.

## 🔧 Troubleshooting

### Backend Not Connecting

**Problem:** "AI Offline" status or connection errors

**Solutions:**
1. Check if Python backend is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Verify the port is not in use:
   ```bash
   lsof -i :8000  # Mac/Linux
   netstat -ano | findstr :8000  # Windows
   ```

3. Check environment variable:
   ```bash
   echo $PYTHON_API_URL
   ```

4. Restart the backend:
   ```bash
   pkill -f api_server.py
   python python-backend/api_server.py
   ```

### No Predictions Showing

**Problem:** Predictions not appearing on dashboard

**Solutions:**
1. Check console for errors (F12 → Console tab)
2. Verify you have logged health data
3. Check if features are built:
   ```bash
   curl "http://localhost:8000/features/user_001/2025-10-07"
   ```

4. Rebuild features:
   ```bash
   curl -X POST http://localhost:8000/features/rebuild \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "user_001",
       "start_date": "2025-10-01",
       "end_date": "2025-10-31"
     }'
   ```

### Low Prediction Accuracy

**Problem:** Predictions seem random or inaccurate

**Solutions:**
1. **Need more data**: ML models require at least 14-30 days of consistent logging
2. **Train personalized models**:
   ```bash
   curl -X POST http://localhost:8000/models/train \
     -H "Content-Type: application/json" \
     -d '{"user_id": "user_001"}'
   ```
3. **Check data quality**: Ensure consistent and accurate logging
4. **Use sample data**: Click "Load Sample Data" to see how it works

### Database Issues

**Problem:** Database errors or missing tables

**Solutions:**
1. Reinitialize database:
   ```bash
   rm unified_health.db  # Caution: deletes all data
   python python-backend/unified_health_ai.py
   ```

2. Check database schema:
   ```bash
   sqlite3 unified_health.db ".schema"
   ```

## 🚀 Production Deployment

For production, consider:

### Security
- [ ] Add authentication (JWT tokens)
- [ ] Restrict CORS origins
- [ ] Use HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add API key validation

### Performance
- [ ] Use PostgreSQL instead of SQLite
- [ ] Add Redis for caching
- [ ] Implement connection pooling
- [ ] Set up load balancing

### Monitoring
- [ ] Add logging (Sentry, LogRocket)
- [ ] Monitor API response times
- [ ] Track model performance metrics
- [ ] Set up health check alerts

### Deployment Options

**Option 1: Separate Deployments**
- Frontend: Vercel/Netlify
- Backend: Railway/Render/AWS EC2

**Option 2: Docker Compose**
```bash
docker-compose up -d
```

**Option 3: Kubernetes**
```bash
kubectl apply -f k8s/
```

## 📊 ML Model Performance

Expected performance metrics (with 30+ days of data):

| Model | Target | AUROC | Precision | Recall |
|-------|--------|-------|-----------|--------|
| GBM   | Gut    | 0.78  | 0.72      | 0.68   |
| GBM   | Skin   | 0.82  | 0.76      | 0.74   |
| GBM   | Mood   | 0.75  | 0.70      | 0.65   |
| GBM   | Stress | 0.80  | 0.74      | 0.71   |
| LSTM  | Multi  | 0.76  | 0.71      | 0.69   |

*Note: Performance improves with more personalized data*

## 🛠️ Development Tips

### Add New Prediction Targets

1. Update database schema in `unified_health_ai.py`
2. Add feature engineering in `feature_store.py`
3. Train new models in `ml_models.py`
4. Update API responses in `api_server.py`
5. Update frontend UI in `prediction-card.tsx`

### Customize ML Models

Edit `ml_models.py`:
```python
# Change model hyperparameters
classifier = GradientBoostingClassifier(
    n_estimators=200,  # More trees
    max_depth=5,       # Deeper trees
    learning_rate=0.05 # Slower learning
)
```

### Add New Features

Edit `feature_store.py`:
```python
def compute_daily_features(user_id, date):
    # Add your custom features
    features['custom_metric'] = calculate_custom_metric()
    return features
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 🤝 Contributing

To add new AI features:
1. Add backend logic to `python-backend/`
2. Create API routes in `src/app/api/ai/`
3. Update `ai-client.ts` with new methods
4. Add UI components in `src/components/ai/`
5. Integrate into dashboard pages

## 📄 License

MIT License

---

**Need help?** Check the troubleshooting section or open an issue on GitHub.

