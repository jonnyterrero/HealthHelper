# 🧑‍⚕️ Holistic Health App

A unified, AI-powered health platform that brings together all of my mini wellness apps into one seamless experience. This app bridges mental health, gut health, skin health, sleep, stress, exercise, and nutrition to give users a complete picture of their wellbeing.

## 🌟 Features

### Nutrition & Symptom Tracker
Log meals, hydration, caffeine, and supplements. Automatically correlate with digestive flare-ups, skin reactions, and energy changes.

### Symptom Predictor (ML/AI)
Uses machine learning to forecast risks and flares based on lifestyle patterns (e.g., "low sleep + high caffeine = ↑ reflux risk").

### Sleep & Stress Tracker
Daily logs for sleep duration, quality, mood, and stress. Links these metrics to physical symptoms, flare-ups, and recovery.

### Exercise & Recovery Tracker
Track workouts, walks, yoga, or other activities. Analyze how movement improves digestion, skin clarity, mood, and overall recovery.

### Skin Health Module (SkinTrack+)
Upload or mark affected skin regions, track medication compliance, and monitor flare cycles. Optional body map for pinpoint logging.

### Gut Health Module (GastroGuard)
Rate and log GI symptoms with scales for pain, bloating, reflux, etc. Includes habit triggers and remedies, personalized to user history.

### Mind & Mood Module (MindMap)
Journaling, mood check-ins, and stress logs. Sentiment analysis provides deeper insights into emotional health trends.

### Personalized Remedy Recommender
Ranks remedies and coping strategies by effectiveness for each individual, learning from past outcomes.

### Wearable Integration (planned)
Future support for Fitbit, Apple Watch, Whoop, Aura, and Flo to pull in biometrics like heart rate, HRV, sleep cycles, and activity.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+ and pip
- Docker and Docker Compose (recommended)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jonnyterrero/HealthHelper.git
   cd HealthHelper/Health\ Helper\ Enhanced
   ```

2. **Start the full system:**
   ```bash
   docker-compose up
   ```

3. **Access the applications:**
   - Frontend: http://localhost:3000
   - AI API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Frontend (Next.js)
```bash
# Navigate to your main Health Helper directory
cd "C:\Users\JTerr\OneDrive\Programming Projects\Health Helper"

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend (Python FastAPI)
```bash
# Navigate to Health Helper Enhanced
cd "Health Helper Enhanced"

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r Configuration/requirements.txt

# Start the AI API server
python Core\ System\HEALTH_AI_API_SERVER.txt
```

### First Time Setup

1. **Load Sample Data:** Click "Quick Start with Sample Data" in the app
2. **Explore Features:** Try logging a meal, symptom, or sleep entry
3. **View Analytics:** Check the Analytics page for AI insights and predictions
4. **Review Predictions:** See ML-powered risk assessments and recommendations

### Configuration

- **Database:** SQLite (default) - easily upgradeable to PostgreSQL
- **AI Models:** Pre-trained models included, retrain with your data
- **Storage:** Local by default, cloud-ready for production

## 🧠 Why It Matters

Health is multi-dimensional. By combining mental, physical, and behavioral data, this app creates a holistic health assistant that helps users understand:

- **What triggers their symptoms**
- **How lifestyle changes reduce flares** 
- **Which remedies actually work best for them**

## 📁 Project Structure

```
Health Helper Enhanced/
├── Core System/           # Database schema, API server, ML models
├── Frontend/             # Next.js integration components
├── AI Features/          # Advanced ML and prediction algorithms
├── Configuration/        # Docker, requirements, deployment
├── Documentation/        # Setup guides and feature documentation
└── README.md            # This file
```

## 🔧 Development

### Adding New Features
1. Update database schema in `Core System/HEALTH_AI_CORE_SYSTEM.txt`
2. Add API endpoints in `Core System/HEALTH_AI_API_SERVER.txt`
3. Update frontend components in `Frontend/HEALTH_AI_FRONTEND_INTEGRATION.txt`
4. Test with sample data and real user scenarios

### AI Model Training
- Models automatically retrain with new data
- Feature engineering happens in `Core System/HEALTH_AI_FEATURE_STORE.txt`
- Advanced ML algorithms in `AI Features/HEALTH_AI_ADDITIONAL_FEATURES.txt`

## 📊 Key Technologies

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, SQLite/PostgreSQL
- **AI/ML:** Scikit-learn, PyTorch, Pandas, NumPy
- **Deployment:** Docker, Docker Compose
- **Data:** Pydantic validation, Feature engineering, Time series analysis

## 🏗️ Architecture Overview

### Core System Components

#### Database Schema (SQLite → PostgreSQL)
- **Users & Apps:** User management and source application tracking
- **Events:** Generic log envelope for idempotency
- **Health Data:** Daily logs, symptoms, meals, sleep, workouts, vitals
- **Feature Store:** Materialized features for ML models
- **AI Models:** Multi-task sequence forecasting, trigger classifiers, remedy ranking

#### AI/ML Pipeline
- **Multi-task Sequence Forecaster:** LSTM/TemporalConv/Transformer for cross-domain predictions
- **Trigger Classifiers:** Fast tabular models for same-day risk assessment
- **Remedy Ranking:** Contextual bandit for personalized recommendations
- **Vision Models:** U-Net for skin lesion segmentation and analysis
- **NLP Models:** Sentiment analysis and topic modeling for journal entries

#### API Endpoints
- **Data Ingestion:** `/api/daily-logs`, `/api/symptoms`, `/api/meals`, `/api/sleep`
- **Predictions:** `/api/predictions/today`, `/api/predictions/sequence`
- **Analytics:** `/api/analytics/correlations`, `/api/analytics/insights`
- **Health Checks:** `/health`, `/api/status`

### Feature Engineering

#### Daily Tabular Features (`fs_daily_user`)
- Sleep quality metrics (duration, efficiency, awakenings)
- Nutrition aggregates (calories, macros, caffeine, triggers)
- Exercise summaries (duration, intensity, type)
- Mental health scores (mood, stress, anxiety)
- Symptom severity trends (gut, skin, general)
- Recovery indicators (meditation, relaxation quality)

#### Sequence Features (`fs_seq_user`)
- N-day rolling windows for time series models
- Lagged features for temporal dependencies
- Seasonal patterns and trends
- Cross-domain correlations (sleep ↔ gut ↔ mood ↔ skin)

#### Vision Features (`fs_vision`)
- Skin lesion metrics (area, color, erythema index)
- Change detection and severity scoring
- Body region mapping and tracking

#### Text Features (`fs_text`)
- Journal sentiment analysis
- Topic modeling and keyword extraction
- Emotional state classification
- Stress and anxiety indicators

## 🔧 Advanced Configuration

### Environment Variables
```env
# Next.js App
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
NODE_ENV=development

# AI API
DATABASE_URL=sqlite:///data/unified_health.db
PYTHONPATH=/app

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Database Options
- **SQLite**: Development (default)
- **PostgreSQL**: Production with full ACID compliance
- **Redis**: Caching layer for improved performance

### Docker Services
- **health-helper**: Next.js frontend (port 3000)
- **ai-api**: Python FastAPI backend (port 8000)
- **redis**: Caching layer (port 6379)
- **postgres**: Database (port 5432)

## 📈 Monitoring & Analytics

### Health Checks
```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:3000

# Check specific service
docker-compose ps
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-api
docker-compose logs -f health-helper
```

### Performance Monitoring
- Model accuracy tracking
- API response times
- Database query performance
- User engagement metrics

## 🔒 Security & Privacy

### Data Protection
- Local-first data storage
- Encrypted data transmission
- User consent management
- GDPR compliance ready

### Production Security
- Environment variable management
- SSL certificate configuration
- Firewall rule setup

## 📊 Enhanced Nutrition Tracking

### Macronutrient Tracking
- **Protein, Carbs, Fat:** Detailed gram tracking
- **Fiber & Sugar:** Digestive health indicators
- **Fat Breakdown:** Saturated, monounsaturated, polyunsaturated, trans fats
- **Cholesterol & Sodium:** Cardiovascular health monitoring

### Micronutrient Tracking
- **Vitamins:** C, D, and other essential vitamins
- **Minerals:** Calcium, iron, magnesium, zinc, potassium
- **Electrolytes:** Sodium, potassium balance tracking

### Food Flags & Triggers
- **Artificial Sweeteners:** Gut health impact tracking
- **Common Triggers:** Dairy, gluten, spicy foods, caffeine
- **Portion Tracking:** Exact gram measurements vs. portion sizes

## 🧠 AI-Powered Insights

### Predictive Analytics
- **Symptom Forecasting:** Predict flare-ups 24-48 hours in advance
- **Trigger Identification:** Learn personal food and lifestyle triggers
- **Recovery Optimization:** Suggest optimal recovery strategies
- **Habit Formation:** Recommend sustainable lifestyle changes

### Personalized Recommendations
- **Remedy Ranking:** AI-powered remedy suggestions based on personal history
- **Lifestyle Optimization:** Personalized exercise, sleep, and nutrition advice
- **Risk Mitigation:** Proactive suggestions to prevent symptom flares
- **Progress Tracking:** Long-term health trend analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for holistic health and wellness**