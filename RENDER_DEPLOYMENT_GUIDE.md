# 🚀 Render Deployment Guide - Docker Method

## ⚠️ **IMPORTANT: Use Docker Environment, NOT Build Command**

The error you're seeing happens because you're using **Build Command** instead of **Docker** environment on Render.

## 🎯 **Correct Render Setup**

### 1. **Create New Web Service on Render**
- Go to [Render Dashboard](https://dashboard.render.com)
- Click "New +" → "Web Service"
- Connect your GitHub repository: `video-downloader-backend`

### 2. **Configure Service Settings**
```
Name: video-downloader-backend
Environment: Docker  ← CRITICAL: Must be Docker, not Node
Branch: main
Root Directory: (leave empty if repo root, or specify if in subfolder)
```

### 3. **Environment Variables**
Add these in Render dashboard:
```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-domain.onrender.com
```

### 4. **Advanced Settings**
```
Docker Command: (leave empty - uses CMD from Dockerfile)
Docker Context Directory: . 
Dockerfile Path: ./Dockerfile
Health Check Path: /api/health
```

## 📋 **Pre-Deployment Checklist**

### ✅ **Files Ready**
- [x] `Dockerfile` - Properly configured with yt-dlp installation
- [x] `render.yaml` - Service configuration
- [x] `package.json` - All dependencies including @types/cors
- [x] Health check endpoint at `/api/health`

### ✅ **Docker Configuration**
Your current Dockerfile is properly configured:
- ✅ Node.js 18 LTS (Render compatible)
- ✅ System yt-dlp installation (no npm package issues)
- ✅ FFmpeg for video processing
- ✅ All dependencies installed for build
- ✅ Health check configured
- ✅ Port from environment variable

## 🚀 **Deploy Steps**

### 1. **Push Latest Changes**
```bash
cd video-downloader-backend
git add .
git commit -m "Add @types/cors and finalize Docker deployment config"
git push origin main
```

### 2. **Deploy on Render**
- Render will automatically detect the push
- Build will use Docker (not build commands)
- Should complete successfully in ~5-10 minutes

### 3. **Verify Deployment**
Once deployed, test these endpoints:
```
GET https://your-backend.onrender.com/api/health
POST https://your-backend.onrender.com/api/youtube-download/info
POST https://your-backend.onrender.com/api/youtube-download/download
```

## 🔧 **If Build Still Fails**

### Check These Settings:
1. **Environment**: Must be "Docker" not "Node"
2. **Dockerfile Path**: `./Dockerfile` (with dot-slash)
3. **Root Directory**: Empty or correct path
4. **Branch**: `main` (or your default branch)

### Common Issues:
- ❌ Using "Node" environment instead of "Docker"
- ❌ Wrong Dockerfile path
- ❌ Missing environment variables
- ❌ Incorrect root directory

## 📊 **Expected Build Output**
```
==> Downloading cache...
==> Building Docker image...
==> Installing system dependencies (yt-dlp, ffmpeg)...
==> Installing npm dependencies...
==> Building NestJS application...
==> Starting health checks...
==> Deploy successful! 🎉
```

## 🌐 **Frontend Integration**
Update your frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## 🎯 **Success Indicators**
- ✅ Build completes without errors
- ✅ Health check passes: `/api/health` returns 200
- ✅ YouTube info endpoint works
- ✅ Video download works
- ✅ Audio download works
- ✅ Shorts support works

Your backend is now ready for Docker deployment on Render! 🚀