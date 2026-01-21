# Simple Render Deployment Guide

## 🚀 Quick Fix for youtube-dl-exec Error

The error you're seeing is because `youtube-dl-exec` tries to download binaries during npm install and hits GitHub rate limits. Here's the simple fix:

## ✅ **What I Fixed:**

1. **Removed problematic packages** from `package.json`:
   - `youtube-dl-exec` ❌ (causes GitHub rate limit error)
   - `yt-dlp-wrap` ❌ (not needed)

2. **Kept the working code**: Your service already uses `yt-dlp` via command line, so no code changes needed!

## 📋 **Simple Render Deployment Steps:**

### Step 1: Push Updated Code
```bash
cd video-downloader-backend
git add .
git commit -m "Fix: Remove youtube-dl-exec for Render deployment"
git push origin main
```

### Step 2: Deploy on Render
1. Go to **Render Dashboard**: https://dashboard.render.com
2. **New +** → **Web Service**
3. **Connect your GitHub repo**
4. **Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: `Node`

### Step 3: Add Environment Variables
| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

### Step 4: Deploy!
Click **"Create Web Service"** and wait 5-10 minutes.

## 🎯 **Why This Works:**

- **Render has yt-dlp pre-installed** in their Linux environment
- Your code uses `exec('yt-dlp ...')` which will find the system yt-dlp
- No more npm package download issues!

## ✅ **Test After Deployment:**

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Test download
curl "https://your-app.onrender.com/api/youtube-download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

That's it! Your backend should now deploy successfully on Render. 🎉