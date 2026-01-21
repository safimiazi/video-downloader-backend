# Render Deployment Guide (Docker Method)

## 🚀 Why Docker is Needed

Render needs Docker to install system packages like `yt-dlp` and `ffmpeg`. The build command method fails because of read-only filesystem restrictions.

## ✅ **What I've Added:**

1. **Dockerfile** - Properly installs yt-dlp and ffmpeg
2. **render.yaml** - Render configuration file
3. **Updated main.ts** - Better port handling for Render

## 📋 **Deployment Steps:**

### Step 1: Push to GitHub
```bash
cd video-downloader-backend
git add .
git commit -m "Add Docker support for Render deployment"
git push origin main
```

### Step 2: Deploy on Render

#### Option A: Using render.yaml (Recommended)
1. Go to **Render Dashboard**: https://dashboard.render.com
2. **New +** → **Blueprint**
3. **Connect GitHub repo**
4. Render will automatically use `render.yaml` configuration

#### Option B: Manual Setup
1. **New +** → **Web Service**
2. **Connect GitHub repo**
3. **Settings**:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Health Check Path**: `/api/health`

### Step 3: Environment Variables (Auto-set by render.yaml)
- `NODE_ENV`: `production`
- `PORT`: `10000`

### Step 4: Deploy!
Click **"Create Web Service"** and wait 5-10 minutes.

## 🎯 **Docker Benefits:**

- ✅ **Reliable yt-dlp installation**
- ✅ **Consistent environment**
- ✅ **Better caching with layers**
- ✅ **Security with non-root user**
- ✅ **Health checks included**

## ✅ **Test After Deployment:**

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Test download
curl "https://your-app.onrender.com/api/youtube-download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## 🐛 **Troubleshooting:**

### If Build Fails:
1. Check Render logs for specific errors
2. Ensure Dockerfile is in root directory
3. Verify GitHub repo is accessible

### If yt-dlp Not Found:
- Docker handles this automatically
- Check container logs for installation errors

### Memory Issues:
- Start with Starter plan ($7/month)
- Upgrade to Standard if needed

Your backend will now deploy successfully with Docker! 🎉