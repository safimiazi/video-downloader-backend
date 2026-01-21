# Use Node.js 20 LTS (Required for NestJS v11)
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp globally (latest version)
RUN pip3 install --break-system-packages --upgrade yt-dlp

# Update yt-dlp to latest version
RUN yt-dlp -U || echo "yt-dlp update attempted"

# Verify yt-dlp installation
RUN yt-dlp --version

# Create app directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies and update lock file
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app && chown -R app /app
USER app

# Expose port (Render uses PORT environment variable)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]