# Health Helper Enhanced - Vercel Deployment Guide
# ================================================
# Complete guide for deploying the full-stack Health Helper app on Vercel

## 🚀 Quick Deployment Steps

### 1. Prepare Your Files
Make sure you have these files in your project root:
- `src/app/page.tsx` - Main Next.js page
- `src/lib/health.ts` - Health data models and ML logic
- `src/components/ui/` - UI components
- `PYTHON_BACKEND_API.py` - Python FastAPI backend
- `requirements.txt` - Python dependencies
- `vercel.json` - Vercel configuration
- `package.json` - Node.js dependencies
- `tailwind.config.js` - Tailwind CSS configuration

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: health-helper-enhanced
# - Directory: ./
# - Override settings? No
```

#### Option B: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and deploy

### 3. Configure Environment Variables
In your Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add these variables:
   - `NEXT_PUBLIC_AI_API_URL`: `https://your-app.vercel.app/api`
   - `DATABASE_URL`: (if using external database)

### 4. Database Setup
The app uses SQLite by default (stored in Vercel's serverless functions).
For production, consider:
- **Vercel Postgres** (recommended)
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

## 📁 Project Structure for Vercel

```
your-project/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard
│   │   ├── layout.tsx        # App layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   └── ui/               # UI components
│   └── lib/
│       ├── health.ts         # Health models & ML
│       └── utils.ts          # Utilities
├── PYTHON_BACKEND_API.py     # Python API
├── requirements.txt          # Python deps
├── package.json             # Node.js deps
├── vercel.json             # Vercel config
└── tailwind.config.js      # Tailwind config
```

## 🔧 Vercel Configuration

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app/page.tsx",
      "use": "@vercel/next"
    },
    {
      "src": "PYTHON_BACKEND_API.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "PYTHON_BACKEND_API.py"
    },
    {
      "src": "/(.*)",
      "dest": "src/app/page.tsx"
    }
  ]
}
```

## 🐍 Python Backend Setup

### requirements.txt
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pandas==2.1.3
numpy==1.24.3
scikit-learn==1.3.2
pydantic==2.5.0
```

### API Endpoints
- `GET /health` - Health check
- `POST /api/health-entries` - Create health entry
- `GET /api/health-entries/{user_id}` - Get user entries
- `POST /api/predictions/sleep/{user_id}` - Sleep quality prediction
- `POST /api/predictions/symptoms/{user_id}` - Symptom risk prediction
- `GET /api/insights/{user_id}` - AI insights
- `GET /api/analytics/trends/{user_id}` - Health trends

## 🎨 Frontend Setup

### package.json
```json
{
  "name": "health-helper-enhanced",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "recharts": "^2.8.0",
    "lucide-react": "^0.292.0"
  }
}
```

### Key Features
- ✅ Detailed nutrition tracking (macros & micros)
- ✅ Symptom logging with Bristol stool scale
- ✅ Sleep & stress tracking
- ✅ Mental health monitoring
- ✅ AI-powered predictions
- ✅ Menstrual cycle tracking
- ✅ Daily flare status
- ✅ Recovery activities tracking
- ✅ ML risk assessments

## 🚀 Deployment Commands

### Local Development
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start development servers
npm run dev          # Frontend on :3000
python PYTHON_BACKEND_API.py  # Backend on :8000
```

### Production Deployment
```bash
# Deploy to Vercel
vercel --prod

# Or use GitHub integration
git push origin main
```

## 🔍 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app.vercel.app/health
```

### 2. API Test
```bash
curl -X POST https://your-app.vercel.app/api/health-entries \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "timestamp": "2024-01-01T00:00:00Z",
    "type": "sleep",
    "data": {"duration": 8, "quality": 7}
  }'
```

### 3. Frontend Test
Visit: `https://your-app.vercel.app`

## 🛠️ Troubleshooting

### Common Issues

#### 1. Python Dependencies
```bash
# Make sure all dependencies are in requirements.txt
pip freeze > requirements.txt
```

#### 2. Build Errors
```bash
# Check Vercel build logs
vercel logs

# Test locally first
npm run build
```

#### 3. API Routes Not Working
- Check `vercel.json` configuration
- Ensure Python file is in root directory
- Verify route patterns match your API endpoints

#### 4. Database Issues
- SQLite works in serverless functions
- For production, use Vercel Postgres or external database
- Check database connection in Python code

## 📊 Monitoring & Analytics

### Vercel Analytics
- Built-in performance monitoring
- Real-time user analytics
- Error tracking

### Custom Monitoring
- Add logging to Python API
- Monitor API response times
- Track user engagement metrics

## 🔒 Security Considerations

### Production Security
- Use environment variables for secrets
- Enable HTTPS (automatic with Vercel)
- Implement rate limiting
- Add input validation

### Data Privacy
- Local-first data storage
- User consent management
- GDPR compliance ready

## 🚀 Scaling Your App

### Performance Optimization
- Use Vercel Edge Functions for global performance
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

### Advanced Features
- Add user authentication
- Implement real-time updates
- Add push notifications
- Integrate with wearables

## 📞 Support

### Getting Help
- Check Vercel documentation
- Review build logs
- Test locally first
- Use Vercel support

### Useful Commands
```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod

# Remove deployment
vercel remove
```

---

**Your Health Helper Enhanced app is now ready for production on Vercel! 🎉**

The app includes:
- Complete full-stack implementation
- AI-powered health predictions
- Detailed nutrition tracking
- Comprehensive symptom monitoring
- Real-time analytics and insights
