# YouTube Download Feature

## Overview

This feature provides comprehensive YouTube video and audio downloading capabilities using the yt-dlp library. It supports both regular YouTube videos and YouTube Shorts, with direct downloads and progressive downloads with real-time progress updates via Server-Sent Events.

## Architecture

### Module Structure
```
youtube-download/
├── youtube-download.module.ts     # Feature module definition
├── youtube-download.controller.ts # HTTP request handling
├── youtube-download.service.ts    # Business logic and yt-dlp integration
├── dto/
│   ├── download-request.dto.ts    # Request validation and transformation
│   └── download-response.dto.ts   # Response type definitions
└── README.md                      # This documentation
```

### Dependencies

#### Required Dependencies
- **@nestjs/core**: ^11.0.0 - NestJS core framework
- **@nestjs/common**: ^11.0.0 - Common NestJS decorators and utilities
- **@nestjs/platform-express**: ^11.0.0 - Express platform adapter
- **@nestjs/config**: Latest - Configuration management
- **reflect-metadata**: Latest - Metadata reflection for decorators
- **rxjs**: Latest - Reactive extensions for JavaScript
- **class-validator**: Latest - DTO validation decorators
- **class-transformer**: Latest - DTO transformation utilities
- **uuid**: Latest - Unique identifier generation
- **@types/uuid**: Latest - TypeScript types for uuid

#### External Tool Dependencies
- **yt-dlp**: Command-line tool for video downloading
  - Installation: `pip install yt-dlp` or `brew install yt-dlp`
  - Version: Latest stable version recommended
  - Purpose: Core video downloading functionality

#### Optional Dependencies (for enhanced functionality)
- **ffmpeg**: Video/audio processing (usually bundled with yt-dlp)
- **youtube-dl-exec**: Alternative to yt-dlp (not currently used)
- **yt-dlp-wrap**: Node.js wrapper for yt-dlp (not currently used)

## API Endpoints

### GET /api/youtube-download

Downloads YouTube videos or audio with various options.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | YouTube video or Shorts URL to download |
| `quality` | string | No | "720" | Video quality (144, 240, 360, 480, 720, 1080, 1440, 2160) |
| `audioOnly` | boolean | No | false | Download audio only as MP3 |
| `progress` | boolean | No | false | Enable progressive download with real-time updates |

#### Response Types

1. **Direct File Download** (default)
   - Content-Type: `video/mp4` or `audio/mpeg`
   - Content-Disposition: `attachment; filename="..."`
   - Body: Binary file data

2. **Fallback URLs** (when direct download fails)
   ```json
   {
     "success": true,
     "directDownload": false,
     "urls": ["https://..."],
     "message": "Direct download not available, use these URLs",
     "instruction": "Video URLs (may need merging)"
   }
   ```

3. **Server-Sent Events** (when progress=true)
   - Content-Type: `text/event-stream`
   - Body: Stream of progress events

4. **Error Response**
   ```json
   {
     "error": "Download failed",
     "details": "Specific error message",
     "suggestion": "Try a different quality or check if yt-dlp is installed"
   }
   ```

## Code Flow

### 1. Request Processing Flow

```
Client Request → Controller → DTO Validation → Service → yt-dlp → Response
```

1. **Controller Reception**: `YoutubeDownloadController.downloadVideo()`
   - Receives HTTP GET request with query parameters
   - Validates required parameters (URL)
   - Routes to appropriate handler based on progress parameter

2. **DTO Validation**: `DownloadRequestDto`
   - Validates URL presence
   - Validates quality parameter against allowed values
   - Transforms string booleans to actual booleans
   - Sets default values for optional parameters

3. **Service Processing**: `YoutubeDownloadService`
   - Generates unique temporary file names
   - Builds yt-dlp commands based on parameters
   - Executes download or creates progress stream
   - Handles file cleanup and error recovery

### 2. Direct Download Flow

```
Service.downloadVideo() → buildDownloadCommand() → execAsync() → File Operations → Response
```

1. **Command Building**: Creates yt-dlp command with appropriate format selectors
2. **Execution**: Runs yt-dlp with 2-minute timeout
3. **File Handling**: Reads downloaded file into buffer
4. **Cleanup**: Removes temporary files
5. **Response**: Returns file buffer with metadata or fallback URLs

### 3. Progressive Download Flow

```
Service.createProgressiveDownloadStream() → ReadableStream → Progress Parsing → SSE Events
```

1. **Stream Creation**: Creates ReadableStream for Server-Sent Events
2. **Process Management**: Spawns yt-dlp child process with progress output
3. **Progress Parsing**: Parses yt-dlp stdout for progress information
4. **Event Emission**: Sends formatted progress events to client
5. **Completion Handling**: Manages process completion and cleanup

### 4. Error Handling Flow

```
Error Detection → Fallback Attempt → Error Response Generation
```

1. **Primary Failure**: Direct download fails
2. **Fallback Attempt**: Try to get direct URLs using `--get-url`
3. **Final Failure**: Return structured error response with suggestions

## Configuration

### Environment Variables

Create a `.env` file in the backend root:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (optional, defaults are set in main.ts)
FRONTEND_URL=http://localhost:3000

# yt-dlp Configuration (optional)
YTDLP_TIMEOUT=120000
YTDLP_PROGRESS_TIMEOUT=300000
```

### yt-dlp Installation

Ensure yt-dlp is installed and accessible in your system PATH:

```bash
# Using pip
pip install yt-dlp

# Using homebrew (macOS)
brew install yt-dlp

# Using npm (alternative)
npm install -g yt-dlp

# Verify installation
yt-dlp --version
```

## Usage Examples

### Basic Video Download
```bash
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID"
```

### YouTube Shorts Download
```bash
curl "http://localhost:3001/api/youtube-download?url=https://youtube.com/shorts/SHORT_ID"
```

### Audio Only Download
```bash
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID&audioOnly=true"
```

### Specific Quality
```bash
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID&quality=1080"
```

### Progressive Download with Progress
```bash
curl "http://localhost:3001/api/youtube-download?url=https://www.youtube.com/watch?v=VIDEO_ID&progress=true"
```

## Integration with Frontend

### Next.js API Route Replacement

Replace the existing Next.js API route with backend calls:

```typescript
// Before (Next.js API route)
const response = await fetch('/api/youtube-download?url=' + encodeURIComponent(url));

// After (NestJS backend)
const response = await fetch('http://localhost:3001/api/youtube-download?url=' + encodeURIComponent(url));
```

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Next.js development server)
- `http://127.0.0.1:3000` (Alternative localhost)

Additional origins can be added in `src/main.ts`.

## Error Handling

### Common Errors and Solutions

1. **"yt-dlp not found"**
   - Solution: Install yt-dlp using pip, brew, or npm
   - Verify: Run `yt-dlp --version` in terminal

2. **"Download timeout"**
   - Solution: Increase timeout in environment variables
   - Alternative: Use progress=true for longer downloads

3. **"Video unavailable"**
   - Solution: Check if video is public and accessible
   - Alternative: Try different quality settings

4. **"Format not available"**
   - Solution: Try different quality or use audioOnly=true
   - Fallback: Use returned direct URLs

### Logging

The service uses NestJS Logger for comprehensive logging:
- Request parameters and commands
- Download progress and completion
- Error details and stack traces
- File cleanup operations

## Performance Considerations

### File Management
- Temporary files are created with unique names to avoid conflicts
- Automatic cleanup prevents disk space issues
- Files are streamed directly to avoid memory issues with large videos

### Timeouts
- Direct downloads: 2 minutes timeout
- Progressive downloads: 5 minutes timeout
- Configurable via environment variables

### Concurrent Downloads
- Each download uses a separate temporary file
- No shared state between requests
- Suitable for multiple concurrent users

## Security Considerations

### Input Validation
- URL parameter is required and validated
- Quality parameter is restricted to allowed values
- Boolean parameters are properly transformed

### File Security
- Temporary files use unique names with timestamps and UUIDs
- Files are automatically cleaned up after use
- No persistent file storage

### CORS Security
- Restricted to specific frontend origins
- Configurable allowed headers and methods

## Future Enhancements

### Planned Features
1. **Authentication**: Add user authentication for download limits
2. **Rate Limiting**: Implement rate limiting per IP/user
3. **Download History**: Track download history and statistics
4. **Batch Downloads**: Support multiple URLs in single request
5. **Format Selection**: More granular format and codec selection
6. **Webhook Support**: Notify external services on download completion

### Additional Platforms
The modular architecture supports easy addition of other platforms:
- TikTok downloads
- Facebook video downloads
- Instagram video downloads
- Twitter video downloads

Each platform would follow the same module structure with its own controller, service, and DTOs.