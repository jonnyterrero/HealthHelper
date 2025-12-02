# Vercel Deployment Checklist

This document outlines the steps to deploy the Health Helper codebase to Vercel and clean up the project structure.

## ✅ Completed Fixes

- [x] Removed Python files from `src/lib` directory
- [x] Fixed `next.config.ts` to remove `outputFileTracingRoot` 
- [x] Created `.vercelignore` to exclude Python backend
- [x] Created `vercel.json` with proper configuration
- [x] Updated `.gitignore` for proper exclusions
- [x] Created `.env.example` with required environment variables
- [x] Updated README with deployment instructions
- [x] Created `python-backend/DEPLOYMENT.md` guide

## 📁 Current Project Structure

```
C:\Users\JTerr\OneDrive\Programming Projects\Health Helper\
├── .git/                                  # Git repository root
├── HealthHelper-codebase/                 # ✅ MAIN CLEAN CODEBASE (USE THIS)
│   ├── src/                              # Next.js source code
│   ├── python-backend/                   # Python ML backend (deploy separately)
│   ├── public/                           # Static assets
│   ├── package.json                      # Dependencies
│   ├── next.config.ts                    # ✅ Fixed for Vercel
│   ├── tsconfig.json                     # TypeScript config
│   ├── vercel.json                       # ✅ Vercel configuration
│   ├── .vercelignore                     # ✅ Exclude Python backend
│   ├── .gitignore                        # ✅ Updated
│   └── .env.example                      # ✅ Environment template
├── Health Helper Enhanced/               # ⚠️ OLD VERSION - CAN DELETE
├── source codes and integrations/        # ⚠️ OLD VERSION - CAN DELETE
├── src/                                  # ⚠️ DUPLICATE - CAN DELETE
└── public/                               # ⚠️ DUPLICATE - CAN DELETE
```

## 🧹 Recommended Cleanup Steps

### 1. Archive or Delete Old Folders

```powershell
# Navigate to project root
cd "C:\Users\JTerr\OneDrive\Programming Projects\Health Helper"

# Option A: Delete old folders (CAREFUL - make sure you have backups!)
# Remove-Item -Recurse -Force "Health Helper Enhanced"
# Remove-Item -Recurse -Force "source codes and integrations"
# Remove-Item -Recurse "src"
# Remove-Item -Recurse "public"

# Option B: Archive them first (SAFER)
Compress-Archive -Path "Health Helper Enhanced" -DestinationPath "Archive_Health_Helper_Enhanced.zip"
Compress-Archive -Path "source codes and integrations" -DestinationPath "Archive_source_codes.zip"

# Then delete after archiving
# Remove-Item -Recurse -Force "Health Helper Enhanced"
# Remove-Item -Recurse -Force "source codes and integrations"
```

### 2. Move HealthHelper-codebase Contents to Root (OPTIONAL)

If you want a cleaner structure, you can move the contents of `HealthHelper-codebase` to the root:

```powershell
# WARNING: Only do this if you understand the implications!
cd "C:\Users\JTerr\OneDrive\Programming Projects\Health Helper"

# Move all files from HealthHelper-codebase to root
# Move-Item -Path "HealthHelper-codebase\*" -Destination "." -Force

# Then delete the empty folder
# Remove-Item "HealthHelper-codebase"
```

**Note**: If you do this, you'll need to update any absolute paths in your code.

### 3. Clean Up Duplicate Files at Root Level

Remove any old config files at the root that conflict with the clean codebase.

## 🚀 Deploy to Vercel

### Option 1: Deploy from HealthHelper-codebase Subdirectory

1. **Login to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Navigate to Clean Codebase**
   ```bash
   cd "C:\Users\JTerr\OneDrive\Programming Projects\Health Helper\HealthHelper-codebase"
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Root Directory in Vercel Dashboard**
   - Go to Project Settings → General
   - Set "Root Directory" to `HealthHelper-codebase` (if deploying from repo root)
   - Or leave empty if deploying from the subdirectory

5. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `PYTHON_API_URL` (leave empty for now, or set to your deployed Python backend)
   - Add any other required variables from `.env.example`

6. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Set framework preset to "Next.js"
5. Set root directory to `HealthHelper-codebase`
6. Set environment variables
7. Click "Deploy"

## 🐍 Deploy Python Backend (Separate)

The Python backend needs to be deployed to a separate service. See `python-backend/DEPLOYMENT.md` for detailed instructions.

### Quick Setup (Railway - Recommended)

1. **Sign up at railway.app**

2. **Create New Project**
   - Connect GitHub repository
   - Select `python-backend` as root directory

3. **Railway Auto-Configuration**
   - Railway detects Python and `requirements.txt`
   - Auto-installs dependencies

4. **Add Start Command**
   ```bash
   uvicorn api_server:app --host 0.0.0.0 --port $PORT
   ```

5. **Copy Railway URL**
   - Example: `https://your-backend.railway.app`

6. **Update Vercel Environment**
   - Go to Vercel dashboard
   - Add `PYTHON_API_URL=https://your-backend.railway.app`
   - Redeploy frontend

## ✅ Verification Checklist

### Frontend (Vercel)

- [ ] Deployment successful without errors
- [ ] Home page loads correctly
- [ ] All routes are accessible (analytics, nutrition, etc.)
- [ ] PWA features work (manifest, service worker)
- [ ] Environment variables are set
- [ ] Build completes in < 5 minutes

### Python Backend (Railway/Render/etc.)

- [ ] `/health` endpoint responds with 200 OK
- [ ] `/docs` shows FastAPI documentation
- [ ] Can ingest data via `/data/ingest`
- [ ] Predictions work via `/predict/daily`
- [ ] CORS configured to allow Vercel domain

### Integration

- [ ] Frontend can reach Python backend (check Network tab)
- [ ] No CORS errors in browser console
- [ ] AI features work end-to-end
- [ ] Error handling works when backend is unavailable

## 🔍 Common Issues & Fixes

### Issue: "Module not found" errors

**Fix**: Ensure all dependencies are in `package.json` and run `npm install`

### Issue: Python backend not reachable

**Fix**: 
1. Check `PYTHON_API_URL` environment variable in Vercel
2. Ensure Python backend is deployed and running
3. Check CORS settings in `api_server.py`

### Issue: Build fails on Vercel

**Fix**:
1. Check build logs for specific errors
2. Verify `next.config.ts` is correct
3. Ensure no Python files are in `src/` directory
4. Check that all imports resolve correctly

### Issue: "outputFileTracingRoot" errors

**Fix**: This has been removed from `next.config.ts` ✅

### Issue: Files outside working directory

**Fix**: Ensure all files are within `HealthHelper-codebase` directory ✅

## 📊 Performance Optimization

After deployment, consider:

1. **Enable Vercel Analytics**
   - Add `@vercel/analytics` package
   - Track page views and performance

2. **Add Edge Functions** (optional)
   - Move some API routes to Edge Runtime for faster response

3. **Optimize Images**
   - Use Next.js `<Image>` component
   - Enable automatic image optimization

4. **Add Caching**
   - Use Vercel's Edge Network caching
   - Add appropriate cache headers

## 🔐 Security Checklist

- [ ] Add API authentication for Python backend
- [ ] Set proper CORS origins (not `**`)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only
- [ ] Add rate limiting to API routes
- [ ] Sanitize user inputs
- [ ] Add security headers (already in `vercel.json` ✅)

## 📝 Post-Deployment

1. **Test All Features**
   - Walk through each page
   - Test data entry and retrieval
   - Test AI predictions (if backend is deployed)
   - Test PWA installation

2. **Monitor Logs**
   - Check Vercel logs for errors
   - Check Python backend logs
   - Set up error tracking (Sentry, LogRocket, etc.)

3. **Set Up CI/CD**
   - Vercel auto-deploys from GitHub
   - Set up branch previews
   - Configure production vs preview environments

4. **Update DNS** (if using custom domain)
   - Add CNAME record pointing to Vercel
   - Update HTTPS settings
   - Force HTTPS redirect

## 🎉 You're Done!

Your Health Helper app should now be live on Vercel! 

**Frontend URL**: https://your-app.vercel.app  
**Python Backend**: https://your-backend.railway.app

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review this checklist
3. Check `VERCEL_DEPLOYMENT.md` and `python-backend/DEPLOYMENT.md`
4. Search Vercel documentation
5. Check Next.js documentation

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Railway Documentation](https://docs.railway.app)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Last Updated**: 2025-10-09  
**Status**: ✅ Ready for Deployment

