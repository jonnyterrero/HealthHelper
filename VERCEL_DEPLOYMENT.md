# 🚀 Deploy Health Helper to Vercel

## Quick Deployment Guide

### Method 1: Vercel CLI (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Deploy**
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time)
- What's your project's name? **health-helper**
- In which directory is your code located? **./**
- Want to override settings? **N**

**Step 4: Deploy to Production**
```bash
vercel --prod
```

### Method 2: Vercel Dashboard (Easier)

**Step 1**: Go to [vercel.com](https://vercel.com)

**Step 2**: Click **"Add New Project"**

**Step 3**: Import your Git repository:
- Connect GitHub/GitLab/Bitbucket
- Select your Health Helper repository
- Click **"Import"**

**Step 4**: Configure project:
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: ./
- **Build Command**: `npm run build` or `bun run build`
- **Output Directory**: .next (auto-filled)
- **Install Command**: `npm install` or `bun install`

**Step 5**: Add Environment Variables (Important!):
```
PYTHON_API_URL=https://your-python-backend.railway.app
DEFAULT_USER_ID=user_001
```

**Step 6**: Click **"Deploy"**

Wait 2-3 minutes... ✨ **Your app is live!**

---

## ⚙️ Configuration

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
```env
PYTHON_API_URL=https://your-backend-url.com
```

**Optional:**
```env
DEFAULT_USER_ID=user_001
NODE_ENV=production
```

### Build Settings

Vercel auto-detects Next.js, but you can customize:

**Framework**: Next.js  
**Build Command**: `npm run build`  
**Output Directory**: .next  
**Install Command**: `npm install`  
**Development Command**: `npm run dev`  
**Node Version**: 18.x or 20.x

---

## 🐍 Python Backend Deployment

Your Python AI backend needs to be deployed separately. Options:

### Option 1: Railway (Recommended)

**Step 1**: Go to [railway.app](https://railway.app)

**Step 2**: New Project → Deploy from GitHub

**Step 3**: Select your repository

**Step 4**: Add service → From repository → Select `python-backend` folder

**Step 5**: Configure:
```
Start Command: uvicorn api_server:app --host 0.0.0.0 --port $PORT
```

**Step 6**: Add environment variables:
```env
PORT=8000
PYTHONPATH=/app
DATABASE_URL=sqlite:///data/unified_health.db
```

**Step 7**: Deploy!

**Step 8**: Copy the Railway URL (e.g., `https://your-app.railway.app`)

**Step 9**: Update Vercel environment variable:
```env
PYTHON_API_URL=https://your-app.railway.app
```

### Option 2: Render

**Step 1**: Go to [render.com](https://render.com)

**Step 2**: New → Web Service

**Step 3**: Connect repository → Select `python-backend` directory

**Step 4**: Configure:
- **Name**: health-helper-ai
- **Runtime**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn api_server:app --host 0.0.0.0 --port $PORT`

**Step 5**: Deploy → Get URL → Update Vercel

### Option 3: AWS Lambda / Google Cloud Run

See detailed guides in their respective documentation.

---

## 🔧 Vercel Configuration File

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "PYTHON_API_URL": "@python_api_url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0"
        }
      ]
    }
  ]
}
```

---

## 🌐 Custom Domain (Optional)

**Step 1**: Go to Vercel Dashboard → Your Project → Settings → Domains

**Step 2**: Add your domain (e.g., `healthhelper.com`)

**Step 3**: Follow DNS configuration:
- **A Record**: Points to Vercel's IP
- **CNAME**: Points to `cname.vercel-dns.com`

**Step 4**: Wait for DNS propagation (5-60 minutes)

**Step 5**: ✅ Your app is live on your domain!

---

## 🔒 Security for Production

### Environment Variables (Vercel)

**Never commit**:
- API keys
- Database URLs
- Secret tokens
- Private keys

**Always use Vercel environment variables** for sensitive data.

### CORS Configuration

Update Python backend `api_server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.vercel.app",
        "https://healthhelper.com"  # Your custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### HTTPS

Vercel automatically provides:
- ✅ Free SSL certificates
- ✅ Automatic HTTPS
- ✅ HTTP → HTTPS redirect

---

## 📊 Monitoring & Analytics

### Vercel Analytics

**Enable in Vercel Dashboard**:
1. Project → Analytics
2. Enable Web Analytics
3. See:
   - Page views
   - Top pages
   - User locations
   - Performance metrics

### Vercel Speed Insights

**Enable**:
1. Project → Speed Insights
2. Enable
3. Monitor:
   - Core Web Vitals
   - Performance scores
   - Real user metrics

### Add to Next.js:

```bash
npm install @vercel/analytics @vercel/speed-insights
```

Update `src/app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Test build locally: `npm run build`
- [ ] Fix any build errors
- [ ] Test in production mode: `npm start`
- [ ] Verify environment variables
- [ ] Check Python backend is deployed
- [ ] Update CORS settings

### During Deployment
- [ ] Push to Git repository
- [ ] Connect repository to Vercel
- [ ] Add environment variables in Vercel
- [ ] Verify build settings
- [ ] Deploy!

### Post-Deployment
- [ ] Test deployed app
- [ ] Check AI backend connection
- [ ] Verify custom date ranges work
- [ ] Test on mobile devices
- [ ] Monitor for errors (Vercel logs)
- [ ] Set up custom domain (optional)
- [ ] Enable analytics (optional)

---

## 🔄 Continuous Deployment

### Automatic Deployments

Once connected, Vercel automatically deploys:

**Production**:
- Every push to `main` branch
- URL: `https://your-project.vercel.app`

**Preview**:
- Every push to other branches
- Unique URLs for testing
- Great for feature development

### Manual Deployments

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Specific branch
vercel --prod --yes
```

---

## 🐛 Troubleshooting

### Build Fails

**Check**:
1. Vercel logs (Dashboard → Deployments → Failed deployment → Logs)
2. TypeScript errors
3. Missing dependencies
4. Environment variables

**Fix**:
```bash
# Test build locally first
npm run build

# Check for errors
npm run lint
```

### Python Backend Not Connecting

**Issue**: AI shows "Offline"

**Solution**:
1. Verify `PYTHON_API_URL` environment variable
2. Check Python backend is deployed and running
3. Test backend URL directly: `https://your-backend.com/health`
4. Update CORS settings to allow Vercel domain

### Environment Variables Not Working

**Issue**: Features not working in production

**Solution**:
1. Vercel Dashboard → Settings → Environment Variables
2. Add all required variables
3. **Redeploy** after adding (important!)
4. Check variable names match exactly

### Custom Domain Issues

**Issue**: Domain not connecting

**Solution**:
1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Check nameservers point to your DNS provider
4. Use Vercel's DNS checker tool

---

## 📈 Performance Optimization

### Vercel Edge Network

**Benefits**:
- Global CDN
- Automatic caching
- Edge functions
- Fast load times worldwide

### Image Optimization

Already optimized with Next.js Image component:
```typescript
import Image from 'next/image'
```

Vercel automatically optimizes images!

### Static Generation

Your app uses client-side rendering, but you can add:
```typescript
export const dynamic = 'force-static' // For static pages
export const revalidate = 3600 // Revalidate every hour
```

---

## 💰 Pricing

### Vercel

**Hobby (Free)**:
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Preview deployments
- ❌ No team features

**Pro ($20/month)**:
- ✅ Everything in Hobby
- ✅ Analytics
- ✅ Password protection
- ✅ Advanced features

**Your app fits in FREE tier!** 🎉

### Python Backend

**Railway**: $5/month (500 hours free)  
**Render**: Free tier available  
**AWS/GCP**: Pay-as-you-go  

---

## 🔗 Useful Links

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel CLI**: https://vercel.com/docs/cli
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs

---

## 🎯 Quick Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod

# View deployment URL
vercel ls

# Check deployment status
vercel inspect <deployment-url>

# Pull environment variables (download to local)
vercel env pull

# View logs
vercel logs <deployment-url>
```

---

## 🎨 Your Deployed App Will Have

✅ **Purple-Pink-Blue Theme**  
✅ **Time Range Charts** (7-180d + custom)  
✅ **AI Predictions** (if backend connected)  
✅ **Mobile-Optimized** (iOS/Android)  
✅ **Dark Mode**  
✅ **Accessibility**  
✅ **Tooltips**  
✅ **Custom Date Ranges**  
✅ **Retroactive Logging**  
✅ **Fast Global CDN**  
✅ **Automatic HTTPS**  
✅ **Free Hosting** (Hobby tier)  

---

## 🎊 Ready to Deploy!

**Your Health Helper app is production-ready!**

**Recommended deployment**:
1. **Vercel** - Frontend (Next.js app)
2. **Railway** - Backend (Python AI)
3. **Connect them** via environment variables

**Total cost**: Free or ~$5/month 💰

**Time to deploy**: 10-15 minutes ⏱️

**Need help?** Follow the steps above or ask me! 💜

