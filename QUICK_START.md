# 🚀 Health Helper - Quick Start Guide

Get your AI-powered Health Dashboard up and running in 5 minutes!

## ✅ What You'll Get

- **Health Tracking Dashboard** with 7/14/30/90/180-day trend views
- **AI Risk Predictions** for gut, skin, mood, and stress
- **Personalized Recommendations** based on your patterns
- **Real-time ML insights** powered by Python backend

## 🎯 Prerequisites

```bash
# Check your versions
node --version   # Should be 18+
python --version # Should be 3.9+
```

## 🏃 Quick Start

### Step 1: Install Frontend Dependencies

```bash
# Using npm
npm install

# OR using bun (faster)
bun install
```

### Step 2: Setup Python Backend

```bash
# Navigate to Python backend
cd python-backend

# Install dependencies
pip install -r requirements.txt

# Initialize database
python unified_health_ai.py

# Start the API server
python api_server.py
```

You should see:
```
🚀 Health AI API started!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal running!**

### Step 3: Configure Environment

```bash
# In the project root, create .env.local
echo "PYTHON_API_URL=http://localhost:8000" > .env.local
echo "DEFAULT_USER_ID=user_001" >> .env.local
```

### Step 4: Start Frontend

```bash
# In a NEW terminal
npm run dev
# OR
bun dev
```

Visit **http://localhost:3000** 🎉

## 🎨 First Time Setup

1. **Load Sample Data**
   - Click the "Load Sample Data" button in the top right
   - This populates the dashboard with realistic health data

2. **Check AI Status**
   - Look for the "AI Connected" badge next to the title
   - 🟢 Green = Python backend is connected
   - 🔴 Red = Backend is offline

3. **View AI Predictions**
   - The AI Predictions card will show risk scores for:
     - 🫃 Digestive Health
     - 🧴 Skin Health
     - 😊 Mood
     - 🧘 Stress
   - Plus personalized recommendations!

4. **Explore Time Ranges**
   - Switch between 7d, 14d, 30d, 90d, and 180d views
   - All charts update automatically

## 📊 Key Features

### Dashboard Page
- **Daily Health Log** - Energy, focus, meditation, mood tracking
- **Nutrition Tracking** - Macros, micros, meal timing
- **Workout & Activity** - Exercise, heart rate, calories
- **Symptoms** - GI flares, skin issues, fatigue, migraines
- **AI Predictions** - Real-time risk scores

### Analytics Page
- **Multi-system trends** - See correlations across health areas
- **Insights generation** - Automatic pattern detection
- **Export functionality** - CSV and PDF reports

### Specialized Modules
- **GastroGuard** - Digestive health tracking
- **SkinTrack+** - Visual skin condition monitoring
- **MindTrack** - Mental health & journaling
- **SleepTrack** - Sleep quality analysis

## 🔧 Troubleshooting

### "AI Offline" Error

**Problem:** Red "AI Offline" badge

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, start it:
cd python-backend
python api_server.py
```

### Port Already in Use

**Problem:** `Error: Port 8000 is already in use`

**Solution:**
```bash
# Kill existing process
# Mac/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### No Predictions Showing

**Problem:** AI Predictions card is empty

**Solution:**
1. Load sample data first
2. Wait a few seconds for processing
3. Check browser console (F12) for errors
4. Verify backend is connected (green badge)

### Module Not Found Error

**Problem:** Python module import errors

**Solution:**
```bash
cd python-backend
pip install --upgrade -r requirements.txt
```

## 💡 Pro Tips

### 1. Customize User ID

Edit `.env.local`:
```env
DEFAULT_USER_ID=your_unique_id
```

### 2. Train Personalized Models

After logging data for 14+ days:
```bash
curl -X POST http://localhost:8000/models/train \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_001", "targets": ["gut", "skin", "mood", "stress"]}'
```

### 3. Use Docker (Advanced)

```bash
# Build and run everything
docker-compose up -d

# Access at:
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### 4. Enable Hot Reload

For Python backend development:
```bash
cd python-backend
uvicorn api_server:app --reload
```

### 5. View API Docs

Open your browser to:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📱 Mobile Access

The app is fully responsive! Access from any device:
```
http://YOUR_LOCAL_IP:3000
```

Find your IP:
```bash
# Mac/Linux
ipconfig getifaddr en0

# Windows
ipconfig | findstr IPv4
```

## 🎯 Next Steps

1. **Log Daily Data** - Start tracking your health consistently
2. **Explore Modules** - Try GastroGuard, SkinTrack+, MindTrack
3. **Check Trends** - Switch between different time ranges
4. **Review AI Insights** - See personalized recommendations
5. **Export Reports** - Generate CSV/PDF summaries

## 📚 Learn More

- **Full Integration Guide**: See `PYTHON_AI_INTEGRATION.md`
- **API Documentation**: http://localhost:8000/docs
- **Feature Analysis**: See `FEATURE_ANALYSIS.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`

## 🆘 Getting Help

### Check Logs

**Frontend:**
```bash
# Browser console (F12)
# Look for errors or warnings
```

**Backend:**
```bash
# Terminal where api_server.py is running
# Shows all API requests and errors
```

### Common Commands

```bash
# Restart everything
pkill -f "node|python"
npm run dev &
cd python-backend && python api_server.py &

# Check status
curl http://localhost:3000
curl http://localhost:8000/health

# View database
cd python-backend
sqlite3 unified_health.db
.tables
.quit
```

## 🎉 Success Checklist

- [ ] Frontend running on http://localhost:3000
- [ ] Backend running on http://localhost:8000
- [ ] "AI Connected" badge is green
- [ ] Sample data loaded successfully
- [ ] AI Predictions card showing risk scores
- [ ] Charts display data for selected time range
- [ ] All specialized modules accessible

## 🚢 Ready for Production?

See `DEPLOYMENT_GUIDE.md` for:
- Vercel/Netlify deployment
- Python backend hosting (Railway, Render, AWS)
- Docker & Kubernetes setup
- Security best practices
- Performance optimization

---

**🎊 You're all set!** Start tracking your health and let AI help you discover patterns.

**Questions?** Open an issue or check the documentation.

