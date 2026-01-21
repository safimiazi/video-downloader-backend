# Video Downloader Backend

A modern NestJS v11 backend application for video downloading with modular architecture. This backend provides APIs for downloading videos from various platforms including YouTube, with support for different qualities, formats, and real-time progress tracking.

## 🚀 Features

- **Modular Architecture**: Each platform (YouTube, TikTok, etc.) is organized as a separate feature module
- **NestJS v11**: Built with the latest NestJS framework using modern TypeScript features
- **Real-time Progress**: Server-Sent Events for live download progress updates
- **Multiple Formats**: Support for video and audio-only downloads
- **Quality Selection**: Download videos in various qualities (144p to 4K)
- **Fallback Mechanism**: Automatic fallback to direct URLs when download fails
- **CORS Enabled**: Ready for frontend integration
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Type Safety**: Full TypeScript support with DTOs and validation

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **yt-dlp**: Latest version installed globally

### Installing yt-dlp

```bash
# Using pip (recommended)
pip install yt-dlp

# Using homebrew (macOS)
brew install yt-dlp

# Using npm (alternative)
npm install -g yt-dlp

# Verify installation
yt-dlp --version
```

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd video-downloader-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

## 🚦 Running the Application

### Development Mode
```bash
npm run start:dev
```
The server will start on `http://localhost:3001` with hot-reload enabled.

### Production Mode
```bash
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 📡 API Endpoints

### YouTube Download API

**Endpoint**: `GET /api/youtube-download`

**Parameters**:
- `url` (required): YouTube video URL
- `quality` (optional): Video quality (144, 240, 360, 480, 720, 1080, 1440, 2160)
- `audioOnly` (optional): Download audio only as MP3 (true/false)
- `progress` (optional): Enable real-time progress updates (true/false)

**Examples**:

```bash
# Basic video download
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID"

# Audio only download
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID&audioOnly=true"

# High quality download
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID&quality=1080"

# Progressive download with real-time progress
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID&progress=true"
```

## 🏗️ Architecture

### Project Structure
```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
└── features/              # Feature modules
    └── youtube-download/  # YouTube download feature
        ├── youtube-download.module.ts     # Feature module
        ├── youtube-download.controller.ts # HTTP controllers
        ├── youtube-download.service.ts    # Business logic
        ├── dto/                          # Data transfer objects
        │   ├── download-request.dto.ts   # Request validation
        │   └── download-response.dto.ts  # Response types
        └── README.md                     # Feature documentation
```

### Module System

Each feature is organized as a self-contained NestJS module:

- **Controller**: Handles HTTP requests and responses
- **Service**: Contains business logic and external integrations
- **DTOs**: Provide request validation and response typing
- **Documentation**: Comprehensive README with architecture details

### Dependencies by Feature

#### YouTube Download Feature
- **Core**: NestJS v11, TypeScript, RxJS
- **Validation**: class-validator, class-transformer
- **External**: yt-dlp (command-line tool)
- **Utilities**: uuid for unique file naming

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment mode |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL for CORS |
| `YTDLP_TIMEOUT` | 120000 | Direct download timeout (ms) |
| `YTDLP_PROGRESS_TIMEOUT` | 300000 | Progressive download timeout (ms) |
| `LOG_LEVEL` | debug | Logging level |

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Next.js development)
- `http://127.0.0.1:3000` (Alternative localhost)

Additional origins can be configured in `src/main.ts`.

## 🔗 Frontend Integration

### Updating Next.js Frontend

Replace the existing Next.js API route calls with backend calls:

```typescript
// Before (Next.js API route)
const response = await fetch('/api/youtube-download?url=' + encodeURIComponent(url));

// After (NestJS backend)
const response = await fetch('http://localhost:3001/api/youtube-download?url=' + encodeURIComponent(url));
```

### Environment Configuration for Frontend

Add to your Next.js `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Then use in your frontend:
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const response = await fetch(`${backendUrl}/api/youtube-download?url=${encodeURIComponent(url)}`);
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the application |
| `npm run start` | Start in production mode |
| `npm run start:dev` | Start in development mode with hot-reload |
| `npm run start:debug` | Start in debug mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 🚨 Troubleshooting

### Common Issues

1. **"yt-dlp not found"**
   ```bash
   # Install yt-dlp
   pip install yt-dlp
   # Verify installation
   yt-dlp --version
   ```

2. **"Port 3001 already in use"**
   ```bash
   # Change port in .env file
   PORT=3002
   ```

3. **CORS errors from frontend**
   - Check that frontend URL is added to CORS configuration in `src/main.ts`
   - Verify frontend is running on expected port

4. **Download timeouts**
   - Increase timeout values in `.env`
   - Use `progress=true` for longer downloads

### Logging

The application provides comprehensive logging:
- Request/response details
- yt-dlp command execution
- File operations and cleanup
- Error details with stack traces

Logs can be filtered by setting `LOG_LEVEL` in environment variables.

## 🔮 Future Enhancements

### Planned Features
- **Additional Platforms**: TikTok, Facebook, Instagram support
- **Authentication**: User authentication and download limits
- **Rate Limiting**: Per-IP and per-user rate limiting
- **Download History**: Track and manage download history
- **Batch Downloads**: Multiple URLs in single request
- **Webhook Support**: External service notifications

### Adding New Platforms

The modular architecture makes it easy to add new platforms:

1. Create new feature module: `src/features/tiktok-download/`
2. Implement controller, service, and DTOs
3. Add module to `app.module.ts`
4. Follow the same patterns as YouTube download feature

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review feature-specific README files
3. Check application logs
4. Create an issue with detailed information