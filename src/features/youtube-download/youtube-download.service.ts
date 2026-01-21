import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { unlink, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { DownloadRequestDto } from './dto/download-request.dto';
import { 
  DownloadSuccessResponseDto, 
  DownloadFallbackResponseDto, 
  DownloadErrorResponseDto,
  ProgressUpdateDto 
} from './dto/download-response.dto';

const execAsync = promisify(exec);

/**
 * YouTube Download Service
 * 
 * This service handles all YouTube video downloading operations using yt-dlp.
 * It supports both direct file downloads and progressive downloads with real-time progress.
 * 
 * Key Features:
 * - Direct video/audio downloads in various qualities
 * - Progressive downloads with Server-Sent Events for real-time progress
 * - Fallback mechanism when direct download fails
 * - Automatic file cleanup after download
 * - Support for both video and audio-only downloads
 * 
 * Dependencies:
 * - yt-dlp: External command-line tool for video downloading
 * - Node.js child_process: For executing yt-dlp commands
 * - File system operations: For temporary file management
 */
@Injectable()
export class YoutubeDownloadService {
  private readonly logger = new Logger(YoutubeDownloadService.name);

  /**
   * Download YouTube video/audio based on provided parameters
   * 
   * @param downloadRequest - Request parameters including URL, quality, format preferences
   * @returns Promise resolving to file buffer and metadata or fallback URLs
   */
  async downloadVideo(downloadRequest: DownloadRequestDto): Promise<{
    buffer?: Buffer;
    metadata?: DownloadSuccessResponseDto;
    fallback?: DownloadFallbackResponseDto;
    error?: DownloadErrorResponseDto;
  }> {
    const { url, quality = '720', audioOnly = false } = downloadRequest;
    
    this.logger.log(`Starting download: URL=${url}, Quality=${quality}, AudioOnly=${audioOnly}`);

    // Generate unique temporary filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const tempFile = join(tmpdir(), `video_${timestamp}_${uniqueId}`);

    try {
      // Build yt-dlp command based on download preferences
      const command = this.buildDownloadCommand(url, quality, audioOnly, tempFile);
      
      this.logger.log(`Executing command: ${command}`);

      // Execute download with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000 // 2 minutes timeout for direct downloads
      });

      this.logger.log('Download completed successfully');
      if (stderr) this.logger.warn(`Download warnings: ${stderr}`);

      // Locate and read the downloaded file
      const ext = audioOnly ? 'mp3' : 'mp4';
      const downloadedFile = `${tempFile}.${ext}`;

      if (!existsSync(downloadedFile)) {
        throw new Error('Downloaded file not found after successful command execution');
      }

      const fileBuffer = await readFile(downloadedFile);
      const stats = await stat(downloadedFile);
      
      // Clean up temporary file
      await this.cleanupFile(downloadedFile);

      // Return successful download response
      const metadata: DownloadSuccessResponseDto = {
        success: true,
        message: 'Download completed successfully',
        fileSize: stats.size,
        contentType: audioOnly ? 'audio/mpeg' : 'video/mp4',
        filename: `download_${quality}${audioOnly ? 'p_audio' : 'p'}.${ext}`
      };

      return { buffer: fileBuffer, metadata };

    } catch (downloadError) {
      this.logger.error(`Direct download failed: ${downloadError.message}`);
      
      // Attempt fallback: get direct URLs instead of downloading
      try {
        const fallbackResponse = await this.getFallbackUrls(url, quality, audioOnly);
        return { fallback: fallbackResponse };
      } catch (fallbackError) {
        this.logger.error(`Fallback also failed: ${fallbackError.message}`);
        
        // Return error response
        const errorResponse: DownloadErrorResponseDto = {
          error: 'Download failed',
          details: downloadError.message,
          suggestion: 'Try a different quality or check if yt-dlp is installed and updated'
        };
        
        return { error: errorResponse };
      }
    }
  }

  /**
   * Handle progressive download with real-time progress updates
   * Returns a readable stream that emits Server-Sent Events with progress information
   * 
   * @param downloadRequest - Request parameters
   * @returns ReadableStream for Server-Sent Events
   */
  createProgressiveDownloadStream(downloadRequest: DownloadRequestDto): ReadableStream<Uint8Array> {
    const { url, quality = '720', audioOnly = false } = downloadRequest;
    const encoder = new TextEncoder();
    
    return new ReadableStream({
      start: (controller) => {
        this.handleProgressiveDownload(controller, encoder, url, quality, audioOnly);
      }
    });
  }

  /**
   * Build yt-dlp command based on download parameters
   * 
   * @private
   */
  private buildDownloadCommand(url: string, quality: string, audioOnly: boolean, tempFile: string): string {
    const baseOptions = '--no-check-certificate --remote-components ejs:github';
    
    if (audioOnly) {
      // Audio-only download as MP3
      return `yt-dlp ${baseOptions} -f "bestaudio" --extract-audio --audio-format mp3 --audio-quality 0 -o "${tempFile}.%(ext)s" "${url}"`;
    } else {
      // Video download with audio, merged to MP4
      return `yt-dlp ${baseOptions} -f "bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}]" --merge-output-format mp4 -o "${tempFile}.%(ext)s" "${url}"`;
    }
  }

  /**
   * Get fallback direct URLs when download fails
   * 
   * @private
   */
  private async getFallbackUrls(url: string, quality: string, audioOnly: boolean): Promise<DownloadFallbackResponseDto> {
    const format = audioOnly 
      ? 'bestaudio' 
      : `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`;

    const { stdout } = await execAsync(
      `yt-dlp --no-check-certificate --remote-components ejs:github --get-url -f "${format}" "${url}"`
    );
    
    const urls = stdout.trim().split('\n').filter(url => url.length > 0);

    return {
      success: true,
      directDownload: false,
      urls: urls,
      message: 'Direct download not available, use these URLs',
      instruction: audioOnly ? 'Audio URL' : 'Video URLs (may need merging)'
    };
  }

  /**
   * Handle progressive download with real-time progress updates
   * 
   * @private
   */
  private handleProgressiveDownload(
    controller: ReadableStreamDefaultController<Uint8Array>,
    encoder: TextEncoder,
    url: string,
    quality: string,
    audioOnly: boolean
  ): void {
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const tempFile = join(tmpdir(), `video_${timestamp}_${uniqueId}`);
    
    // Build command with progress output
    const command = this.buildProgressCommand(url, quality, audioOnly, tempFile);
    
    this.logger.log(`Starting progressive download: ${command}`);

    const child = exec(command, { timeout: 300000 }); // 5 minutes timeout
    let controllerClosed = false;

    // Helper function to safely send progress updates
    const safeEnqueue = (data: ProgressUpdateDto) => {
      if (!controllerClosed) {
        try {
          const sseData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (error) {
          this.logger.warn('Controller already closed, ignoring progress update');
          controllerClosed = true;
        }
      }
    };

    // Send initial progress update
    safeEnqueue({
      type: 'start',
      message: 'Starting download...',
      progress: 0
    });

    // Handle stdout for progress parsing
    child.stdout?.on('data', (data) => {
      const output = data.toString();
      this.parseProgressOutput(output, safeEnqueue);
    });

    // Handle stderr for error detection
    child.stderr?.on('data', (data) => {
      const errorOutput = data.toString();
      this.logger.warn(`yt-dlp stderr: ${errorOutput}`);
      
      // Only send error if it's a critical error
      if (errorOutput.toLowerCase().includes('error') && !errorOutput.includes('warning')) {
        safeEnqueue({
          type: 'error',
          message: `Download error: ${errorOutput.substring(0, 100)}`
        });
      }
    });

    // Handle process completion
    child.on('close', async (code) => {
      await this.handleProgressComplete(code, tempFile, audioOnly, url, quality, safeEnqueue, controller);
      controllerClosed = true;
    });

    // Handle process errors
    child.on('error', (processError) => {
      this.logger.error(`Process error: ${processError.message}`);
      safeEnqueue({
        type: 'error',
        message: `Process failed: ${processError.message}`
      });
      
      if (!controllerClosed) {
        try {
          controller.close();
          controllerClosed = true;
        } catch (closeError) {
          this.logger.warn('Controller already closed during error handling');
        }
      }
    });
  }

  /**
   * Build yt-dlp command for progressive download with progress output
   * 
   * @private
   */
  private buildProgressCommand(url: string, quality: string, audioOnly: boolean, tempFile: string): string {
    const baseOptions = '--no-check-certificate --remote-components ejs:github --progress --newline';
    
    if (audioOnly) {
      return `yt-dlp ${baseOptions} -f "bestaudio" --extract-audio --audio-format mp3 --audio-quality 0 -o "${tempFile}.%(ext)s" "${url}"`;
    } else {
      return `yt-dlp ${baseOptions} -f "bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}]" --merge-output-format mp4 -o "${tempFile}.%(ext)s" "${url}"`;
    }
  }

  /**
   * Parse yt-dlp output for progress information
   * 
   * @private
   */
  private parseProgressOutput(output: string, safeEnqueue: (data: ProgressUpdateDto) => void): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Parse download progress
      if (line.includes('[download]') && line.includes('%')) {
        const progressMatch = line.match(/(\d+\.?\d*)%/);
        const sizeMatch = line.match(/(\d+\.?\d*[KMGT]?iB)/g);
        
        if (progressMatch) {
          const progress = parseFloat(progressMatch[1]);
          let downloadedSize = 0;
          let totalSize = 0;
          
          if (sizeMatch && sizeMatch.length >= 2) {
            downloadedSize = this.parseFileSize(sizeMatch[0]);
            totalSize = this.parseFileSize(sizeMatch[1]);
          }

          safeEnqueue({
            type: 'progress',
            progress: Math.min(progress, 100),
            downloadedSize,
            totalSize,
            message: `Downloading... ${progress.toFixed(1)}%`
          });
        }
      }
      
      // Detect post-processing phase
      if (line.includes('[ffmpeg]') || line.includes('Merging')) {
        safeEnqueue({
          type: 'processing',
          progress: 95,
          message: 'Processing video...'
        });
      }
    }
  }

  /**
   * Handle completion of progressive download
   * 
   * @private
   */
  private async handleProgressComplete(
    code: number,
    tempFile: string,
    audioOnly: boolean,
    url: string,
    quality: string,
    safeEnqueue: (data: ProgressUpdateDto) => void,
    controller: ReadableStreamDefaultController<Uint8Array>
  ): Promise<void> {
    if (code === 0) {
      // Download completed successfully
      const ext = audioOnly ? 'mp3' : 'mp4';
      const downloadedFile = `${tempFile}.${ext}`;
      
      try {
        if (existsSync(downloadedFile)) {
          const stats = await stat(downloadedFile);
          
          safeEnqueue({
            type: 'complete',
            progress: 100,
            fileSize: stats.size,
            downloadUrl: `/api/youtube-download?url=${encodeURIComponent(url)}&quality=${quality}&audioOnly=${audioOnly}`,
            message: 'Download completed!'
          });
          
          // Clean up the temporary file
          await this.cleanupFile(downloadedFile);
        } else {
          throw new Error('Downloaded file not found');
        }
      } catch (fileError) {
        this.logger.error(`File processing error: ${fileError.message}`);
        safeEnqueue({
          type: 'error',
          message: 'File processing failed'
        });
      }
    } else {
      safeEnqueue({
        type: 'error',
        message: `Download failed with exit code ${code}`
      });
    }
    
    try {
      controller.close();
    } catch (closeError) {
      this.logger.warn('Controller already closed');
    }
  }

  /**
   * Parse file size strings from yt-dlp output
   * 
   * @private
   */
  private parseFileSize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+\.?\d*)([KMGT]?i?B)/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    const multipliers: { [key: string]: number } = {
      'B': 1,
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024,
      'TiB': 1024 * 1024 * 1024 * 1024,
      'KB': 1000,
      'MB': 1000 * 1000,
      'GB': 1000 * 1000 * 1000,
      'TB': 1000 * 1000 * 1000 * 1000,
    };
    
    return value * (multipliers[unit] || 1);
  }

  /**
   * Clean up temporary files
   * 
   * @private
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      this.logger.log(`Cleaned up temporary file: ${filePath}`);
    } catch (cleanupError) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${cleanupError.message}`);
    }
  }
}