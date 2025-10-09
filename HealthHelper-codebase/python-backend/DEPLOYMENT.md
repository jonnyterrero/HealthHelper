# Python Backend Deployment Guide

This guide explains how to deploy the Health Helper Python backend for production use with Vercel-hosted frontend.

## Overview

The Python backend provides ML-powered health predictions and analytics. It's designed to be deployed separately from the Next.js frontend on Vercel.

## Recommended Hosting Platforms

### 1. Railway (Recommended)
**Pros**: Easy setup, auto-deploys from GitHub, built-in PostgreSQL
**Pricing**: $5/month starter

**Steps**:
1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and `python-backend` directory
4. Railway auto-detects Python and uses `requirements.txt`
5. Add environment variables in Railway dashboard
6. Copy the generated URL and set it as `PYTHON_API_URL` in Vercel

### 2. Render
**Pros**: Free tier available, simple deployment
**Pricing**: Free tier (limited), $7/month for production

**Steps**:
1. Sign up at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Set:
   - **Root Directory**: `python-backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy and copy the URL to use as `PYTHON_API_URL`

### 3. Fly.io
**Pros**: Global edge deployment, generous free tier
**Pricing**: Free tier available

**Steps**:
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create app: `cd python-backend && fly launch`
4. Deploy: `fly deploy`
5. Get URL: `fly status`
6. Set URL as `PYTHON_API_URL` in Vercel

### 4. Google Cloud Run
**Pros**: Serverless, scales to zero, pay per use
**Pricing**: Free tier, then pay per request

**Steps**:
1. Create `Dockerfile` in `python-backend/`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8080"]
   ```
2. Build and push to Google Container Registry
3. Deploy to Cloud Run
4. Copy URL to Vercel as `PYTHON_API_URL`

### 5. AWS Lambda (Advanced)
**Pros**: True serverless, pay per invocation
**Pricing**: Very cheap for low traffic

Requires using Mangum adapter for FastAPI. See AWS Lambda documentation.

## Environment Variables

Set these in your hosting platform:

```bash
# Optional: Database connection
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional: API keys if using external services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Model storage
MODEL_STORAGE_PATH=/app/models

# Optional: Feature flags
ENABLE_TRAINING=true
ENABLE_PREDICTIONS=true
```

## Connecting to Vercel Frontend

After deploying the Python backend:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add new variable:
   - **Name**: `PYTHON_API_URL`
   - **Value**: Your deployed Python backend URL (e.g., `https://your-app.railway.app`)
4. Redeploy your Vercel frontend

## Health Checks

All platforms support health checks. Use:
- **Endpoint**: `GET /health` or `GET /`
- **Expected Response**: `{"status": "healthy", ...}`

## Scaling Considerations

### For Low Traffic (< 1000 requests/day)
- Use Render free tier or Fly.io free tier
- No database needed (use in-memory storage)

### For Medium Traffic (1K-10K requests/day)
- Use Railway or Render paid tier
- Add PostgreSQL database
- Enable request caching

### For High Traffic (10K+ requests/day)
- Use Google Cloud Run or AWS Lambda
- Add Redis for caching
- Use CDN for static responses
- Consider load balancing

## Monitoring

### Railway
- Built-in metrics and logs in dashboard
- Set up deployment notifications

### Render
- Logs available in dashboard
- Add health check monitoring

### Fly.io
- Use `fly logs` for real-time logs
- Built-in metrics dashboard

## Troubleshooting

### Common Issues

**1. ModuleNotFoundError**
- Ensure all dependencies are in `requirements.txt`
- Check Python version (should be 3.9+)

**2. Port binding errors**
- Use `PORT` environment variable provided by platform
- Update command: `--port $PORT` or `--port ${PORT}`

**3. CORS errors**
- Ensure CORS middleware is properly configured in `api_server.py`
- Add your Vercel domain to allowed origins

**4. Timeout errors**
- Increase timeout settings in platform config
- Optimize model loading (lazy load or cache)

**5. Memory errors**
- Upgrade to higher memory tier
- Reduce model size or use quantization
- Implement model streaming

## Security Best Practices

1. **API Authentication**: Add API key validation in production
2. **Rate Limiting**: Implement request rate limiting
3. **Input Validation**: Validate all inputs (already in place via Pydantic)
4. **HTTPS Only**: Ensure platform uses HTTPS (most do by default)
5. **Environment Variables**: Never commit secrets to git
6. **CORS**: Restrict to your Vercel domain only

## Cost Optimization

1. **Use Free Tiers**: Start with free tiers for testing
2. **Scale to Zero**: Use platforms that scale to zero (Cloud Run, Fly.io)
3. **Cache Responses**: Implement Redis caching for repeated requests
4. **Optimize Models**: Use smaller models or quantization
5. **Batch Requests**: Batch ML predictions when possible

## Example Production Setup (Railway)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create new project
railway init

# 4. Set environment variables
railway variables set PYTHON_API_URL=https://your-frontend.vercel.app

# 5. Deploy
railway up

# 6. Get deployment URL
railway status

# 7. Set URL in Vercel
# Go to Vercel dashboard → Settings → Environment Variables
# Add: PYTHON_API_URL=https://your-backend.railway.app
```

## Continuous Deployment

### GitHub Actions (for Railway)
Create `.github/workflows/deploy-python.yml`:

```yaml
name: Deploy Python Backend

on:
  push:
    branches: [main]
    paths:
      - 'python-backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway up --service python-backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Support

For deployment issues:
1. Check platform documentation
2. Review application logs
3. Test locally with production environment variables
4. Open an issue in the repository

---

**Note**: The Python backend is optional. The frontend will work without it, but ML-powered features will be unavailable.

