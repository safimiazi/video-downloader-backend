import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  Logger,
  StreamableFile,
  Header,
} from "@nestjs/common";
import { Response } from "express";
import { YoutubeDownloadService } from "./youtube-download.service";
import { DownloadRequestDto } from "./dto/download-request.dto";

/**
 * YouTube Download Controller
 *
 * This controller handles HTTP requests for YouTube video downloading functionality.
 * It provides endpoints for both direct downloads and progressive downloads with real-time progress.
 *
 * Endpoints:
 * - GET /api/youtube-download: Download YouTube videos/audio
 *   - Supports direct file download or fallback URLs
 *   - Supports progressive download with Server-Sent Events
 *
 * Query Parameters:
 * - url (required): YouTube video URL
 * - quality (optional): Video quality (144, 240, 360, 480, 720, 1080, 1440, 2160)
 * - audioOnly (optional): Download audio only as MP3 (true/false)
 * - progress (optional): Enable progressive download with real-time updates (true/false)
 *
 * Response Types:
 * - File stream: Direct video/audio file download
 * - JSON: Fallback URLs when direct download fails
 * - Server-Sent Events: Real-time progress updates (when progress=true)
 * - JSON Error: Error information when download fails
 */
@Controller("youtube-download")
export class YoutubeDownloadController {
  private readonly logger = new Logger(YoutubeDownloadController.name);

  constructor(
    private readonly youtubeDownloadService: YoutubeDownloadService,
  ) {}

  /**
   * Download YouTube video or audio
   *
   * This endpoint handles YouTube video/audio downloads with multiple response types:
   * 1. Direct file download (most common case)
   * 2. Progressive download with Server-Sent Events (when progress=true)
   * 3. Fallback URLs (when direct download fails)
   * 4. Error response (when all methods fail)
   *
   * @param query - Download parameters (URL, quality, format preferences)
   * @param res - Express response object for streaming
   * @returns File stream, JSON response, or Server-Sent Events stream
   */
  @Get()
  async downloadVideo(
    @Query() query: DownloadRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate required parameters
      if (!query.url) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: "URL is required",
          details: "Please provide a valid YouTube URL",
          suggestion: "Add ?url=<youtube_url> to your request",
        });
        return;
      }

      this.logger.log(`Download request received: ${JSON.stringify(query)}`);

      // Handle progressive download with Server-Sent Events
      if (query.progress) {
        await this.handleProgressiveDownload(query, res);
        return;
      }

      // Handle direct download
      await this.handleDirectDownload(query, res);
    } catch (error) {
      this.logger.error(`Controller error: ${error.message}`, error.stack);

      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: "Internal server error",
          details: error.message,
          suggestion:
            "Please try again or contact support if the issue persists",
        });
      }
    }
  }

  /**
   * Handle direct video/audio download
   * Returns file stream, fallback URLs, or error response
   *
   * @private
   */
  private async handleDirectDownload(
    query: DownloadRequestDto,
    res: Response,
  ): Promise<void> {
    const result = await this.youtubeDownloadService.downloadVideo(query);

    if (result.buffer && result.metadata) {
      // Successful direct download - stream the file
      this.logger.log(
        `Streaming file: ${result.metadata.filename} (${result.metadata.fileSize} bytes)`,
      );

      res.set({
        "Content-Type": result.metadata.contentType,
        "Content-Disposition": `attachment; filename="${result.metadata.filename}"`,
        "Content-Length": result.metadata.fileSize?.toString() || "",
        "Cache-Control": "no-cache",
      });

      res.end(result.buffer);
    } else if (result.fallback) {
      // Fallback URLs when direct download fails
      this.logger.log("Returning fallback URLs");
      res.status(HttpStatus.OK).json(result.fallback);
    } else if (result.error) {
      // Download failed completely
      this.logger.error(`Download failed: ${result.error.details}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result.error);
    } else {
      // Unexpected result state
      this.logger.error("Unexpected result state from download service");
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Unexpected error",
        details: "Download service returned unexpected result",
        suggestion: "Please try again",
      });
    }
  }

  /**
   * Handle progressive download with Server-Sent Events
   * Streams real-time progress updates to the client
   *
   * @private
   */
  private async handleProgressiveDownload(
    query: DownloadRequestDto,
    res: Response,
  ): Promise<void> {
    this.logger.log("Starting progressive download with Server-Sent Events");

    // Set Server-Sent Events headers
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    try {
      // Get progress stream from service
      const progressStream =
        this.youtubeDownloadService.createProgressiveDownloadStream(query);

      // Create a readable stream and pipe it to response
      const reader = progressStream.getReader();

      const pump = async (): Promise<void> => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Write progress data to response
            res.write(value);
          }
        } catch (streamError) {
          this.logger.error(`Stream error: ${streamError.message}`);

          // Send error event and close connection
          const errorEvent = `data: ${JSON.stringify({
            type: "error",
            message: "Stream error occurred",
          })}\n\n`;

          res.write(errorEvent);
        } finally {
          res.end();
        }
      };

      // Handle client disconnect
      res.on("close", () => {
        this.logger.log("Client disconnected from progress stream");
        reader.cancel();
      });

      // Start pumping data
      await pump();
    } catch (streamError) {
      this.logger.error(`Progressive download error: ${streamError.message}`);

      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: "Progressive download failed",
          details: streamError.message,
          suggestion: "Try without progress parameter for direct download",
        });
      }
    }
  }
}
