# Python AI Backend Integration Guide

This guide explains how to integrate and use the Python AI backend with the Next.js Health Helper app.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js App   │────────▶│  Next.js API     │────────▶│  Python FastAPI │
│   (Frontend)    │         │  Routes (Proxy)  │         │     Backend     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
       │                            │                              │
       │                            │                              │
       ▼                            ▼                              ▼
  Browser Storage           API Translation            SQLite Database
  (localStorage)            & Error Handling          + ML Models
```

## Setup Instructions

### 1. Python Backend Setup

```bash
# Navigate to Python backend directory
cd python-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python unified_health_ai.py

# Start the API server
python api_server.py
```

The Python backend will be available at `http://localhost:8000`

### 2. Next.js Frontend Setup

```bash
# Create .env file
cp .env.example .env

# Update .env with Python API URL
# PYTHON_API_URL=http://localhost:8000

# Install Next.js dependencies (if not already done)
npm install

# Start Next.js dev server
npm run dev
```

The Next.js app will be available at `http://localhost:3000`

## Usage

### Basic Data Flow

1. **User enters health data** in the Next.js frontend
2. **Frontend saves to localStorage** (existing behavior)
3. **Frontend optionally syncs to AI backend** via API routes
4. **Python backend processes data**:
   - Stores in SQLite database
   - Builds ML features
   - Trains/updates models
   - Generates predictions
5. **Frontend displays AI insights** and recommendations

### Frontend Integration Example

```typescript
import { aiClient } from '@/lib/ai-client';

// In your component
async function handleSaveWithAI() {
  const userId = 'user_001'; // Get from auth system
  const date = todayISO();
  
  try {
    // 1. Save health data (existing localStorage behavior)
    const healthData = {
      stomach: { severity: 5, /* ... */ },
      skin: { severity: 3, /* ... */ },
      mental: { mood: 7, /* ... */ }
    };
    
    // 2. Sync to AI backend
    await aiClient.ingestData({
      user_id: userId,
      data_type: 'daily_log',
      data: {
        date,
        mood: healthData.mental.mood,
        stress: healthData.mental.stress,
        // ...
      }
    });
    
    // 3. Rebuild features and get predictions
    const predictions = await aiClient.fullSync(
      userId,
      [
        { type: 'daily_log', data: { /* ... */ } },
        { type: 'symptom', data: { /* ... */ } }
      ],
      date
    );
    
    // 4. Display AI insights
    console.log('Risk predictions:', predictions.predictions);
    console.log('Recommendations:', predictions.recommendations);
    
  } catch (error) {
    console.error('AI backend sync failed:', error);
    // Fallback to local-only behavior
  }
}
```

### API Routes

All Python backend endpoints are proxied through Next.js API routes:

- `POST /api/ai/predict` - Get AI predictions
- `POST /api/ai/ingest` - Ingest health data
- `POST /api/ai/features` - Rebuild features
- `GET /api/ai/features?user_id=X&date=Y` - Get features
- `POST /api/ai/train` - Train ML models
- `GET /api/ai/analytics?user_id=X&type=summary` - Get analytics

### AI Client Methods

```typescript
// Get predictions
const predictions = await aiClient.getPredictions({
  user_id: 'user_001',
  date: '2025-01-15'
});

// Ingest single data point
await aiClient.ingestData({
  user_id: 'user_001',
  data_type: 'daily_log',
  data: { date: '2025-01-15', mood: 7, stress: 4 }
});

// Batch ingest multiple data points
await aiClient.batchIngest('user_001', [
  { type: 'daily_log', data: { /* ... */ } },
  { type: 'symptom', data: { /* ... */ } },
  { type: 'meal', data: { /* ... */ } }
]);

// Rebuild features for date range
await aiClient.rebuildFeatures({
  user_id: 'user_001',
  start_date: '2025-01-01',
  end_date: '2025-01-31'
});

// Train models (background task)
await aiClient.trainModels({
  user_id: 'user_001',
  targets: ['gut', 'skin', 'mood', 'stress']
});

// Get analytics
const summary = await aiClient.getAnalytics('user_001', 'summary');
const trends = await aiClient.getAnalytics('user_001', 'trends', 30);

// Full sync: ingest + rebuild + predict
const result = await aiClient.fullSync(
  'user_001',
  dataPoints,
  '2025-01-15'
);
```

## Data Mapping

### From Next.js to Python Backend

| Next.js localStorage | Python Backend Table | Data Type |
|---------------------|---------------------|-----------|
| health entries      | daily_logs          | DailyLogIn |
| stomach symptoms    | symptoms (type='gut') | SymptomIn |
| skin symptoms       | symptoms (type='skin') | SymptomIn |
| meal logs           | meals               | MealIn |
| sleep sessions      | sleep_sessions      | SleepSessionIn |
| workout logs        | workouts            | WorkoutIn |
| journal entries     | journals            | JournalIn |

### Example Data Conversion

```typescript
// Next.js health entry
const localEntry = {
  date: '2025-01-15',
  stomach: { severity: 6, painLocation: 'upper-abdomen', triggers: { dairy: true } },
  skin: { severity: 4, area: 'face', rash: true },
  mental: { mood: 6, anxiety: 5, sleepHours: 7, stressLevel: 6 }
};

// Convert to Python backend format
const dailyLog = {
  user_id: 'user_001',
  date: localEntry.date,
  mood: localEntry.mental.mood,
  stress: localEntry.mental.stressLevel,
  energy: localEntry.mental.energy || 5,
  focus: localEntry.mental.focus || 5
};

const stomachSymptom = {
  user_id: 'user_001',
  date: localEntry.date,
  type: 'gut',
  severity: localEntry.stomach.severity,
  location: localEntry.stomach.painLocation,
  triggers: Object.keys(localEntry.stomach.triggers).filter(k => localEntry.stomach.triggers[k])
};

// Send to backend
await aiClient.ingestData({ user_id: 'user_001', data_type: 'daily_log', data: dailyLog });
await aiClient.ingestData({ user_id: 'user_001', data_type: 'symptom', data: stomachSymptom });
```

## Progressive Enhancement Strategy

The Python AI backend is designed as a **progressive enhancement** to the existing app:

### Phase 1: Optional AI Features (Current)
- App works fully with localStorage (existing behavior)
- AI backend is optional enhancement
- Graceful fallback if Python backend is unavailable
- No breaking changes to existing functionality

### Phase 2: Hybrid Mode (Recommended)
- Use localStorage for real-time UI updates
- Sync to AI backend in background
- Display AI insights when available
- Local ML predictions as fallback

### Phase 3: Full AI Integration (Advanced)
- Primary data store is Python backend
- localStorage as cache only
- Real-time AI predictions
- Personalized ML models per user

## Performance Considerations

### Caching Strategy

```typescript
// Cache predictions for 1 hour
const cachedPredictions = localStorage.getItem(`predictions_${userId}_${date}`);
if (cachedPredictions) {
  const { predictions, timestamp } = JSON.parse(cachedPredictions);
  if (Date.now() - timestamp < 3600000) { // 1 hour
    return predictions;
  }
}

// Fetch new predictions
const newPredictions = await aiClient.getPredictions({ user_id: userId, date });
localStorage.setItem(`predictions_${userId}_${date}`, JSON.stringify({
  predictions: newPredictions,
  timestamp: Date.now()
}));
```

### Background Sync

```typescript
// Sync in background without blocking UI
async function syncInBackground(userId: string, data: any) {
  try {
    await aiClient.ingestData({ user_id: userId, data_type: 'daily_log', data });
  } catch (error) {
    // Queue for retry
    const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
    queue.push({ userId, data, timestamp: Date.now() });
    localStorage.setItem('sync_queue', JSON.stringify(queue));
  }
}

// Retry failed syncs
async function retrySyncQueue() {
  const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
  for (const item of queue) {
    try {
      await aiClient.ingestData({ user_id: item.userId, data_type: 'daily_log', data: item.data });
      // Remove from queue on success
    } catch (error) {
      // Keep in queue for next retry
    }
  }
}
```

## Troubleshooting

### Python Backend Not Responding

```typescript
// Check if Python backend is available
async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/health');
    return response.ok;
  } catch {
    return false;
  }
}

// Use in component
const [backendAvailable, setBackendAvailable] = useState(false);

useEffect(() => {
  checkBackendHealth().then(setBackendAvailable);
}, []);

// Conditionally show AI features
{backendAvailable && (
  <div className="ai-insights">
    {/* AI predictions and recommendations */}
  </div>
)}
```

### CORS Issues

If you encounter CORS errors:

1. Update Python backend `api_server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. Or use Next.js API routes as proxy (already implemented)

### Database Locked Errors

SQLite can have locking issues with concurrent writes:

```python
# In unified_health_ai.py, add timeout
def get_conn():
    conn = sqlite3.connect(DB_PATH.as_posix(), timeout=10.0)
    # ...
```

## Security Considerations

### Production Deployment

For production, implement:

1. **Authentication**: Add JWT tokens or API keys
2. **Rate Limiting**: Prevent abuse of AI endpoints
3. **Input Validation**: Sanitize all user inputs
4. **HTTPS**: Use TLS for all connections
5. **Database**: Use PostgreSQL instead of SQLite
6. **Monitoring**: Add logging and error tracking

### Example with Authentication

```typescript
// Add auth token to AI client
class AuthAIClient extends AIClient {
  constructor(baseUrl: string, token: string) {
    super(baseUrl);
    this.token = token;
  }

  async getPredictions(request: PredictionRequest): Promise<PredictionResponse> {
    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(request),
    });
    // ...
  }
}
```

## Development Workflow

### 1. Local Development

```bash
# Terminal 1: Python backend
cd python-backend
source venv/bin/activate
python api_server.py

# Terminal 2: Next.js app
npm run dev
```

### 2. Testing AI Features

```bash
# Test Python backend directly
curl -X POST http://localhost:8000/data/ingest \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","data_type":"daily_log","data":{"date":"2025-01-15","mood":7}}'

# Test through Next.js proxy
curl -X POST http://localhost:3000/api/ai/ingest \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","data_type":"daily_log","data":{"date":"2025-01-15","mood":7}}'
```

### 3. Model Training Workflow

```typescript
// 1. Accumulate data for 30+ days
// 2. Trigger training
await aiClient.trainModels({ user_id: 'user_001' });

// 3. Check training status
const status = await fetch('/api/ai/analytics?user_id=user_001&type=summary');

// 4. Use trained models for predictions
const predictions = await aiClient.getPredictions({ user_id: 'user_001', date: today() });
```

## Future Enhancements

- **Real-time predictions**: WebSocket connection for live updates
- **Multi-user support**: User authentication and data isolation
- **Advanced ML models**: Deep learning for better predictions
- **Mobile app integration**: React Native client
- **Cloud deployment**: AWS/GCP/Azure hosting
- **Data visualization**: Interactive dashboards
- **Export/Import**: Backup and restore functionality

## Support

For issues or questions:
1. Check Python backend logs: `python-backend/logs/`
2. Check Next.js console for errors
3. Verify both servers are running
4. Test direct Python API calls first
5. Test through Next.js proxy second

## License

MIT License