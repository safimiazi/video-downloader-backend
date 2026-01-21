import { Module } from '@nestjs/common';
import { YoutubeDownloadController } from './youtube-download.controller';
import { YoutubeDownloadService } from './youtube-download.service';

/**
 * YouTube Download Feature Module
 * 
 * This module encapsulates all YouTube video downloading functionality
 * including controllers, services, and related components.
 * 
 * Architecture:
 * - Controller: Handles HTTP requests and responses
 * - Service: Contains business logic for video downloading
 * - DTOs: Data transfer objects for request/response validation
 */
@Module({
  controllers: [YoutubeDownloadController],
  providers: [YoutubeDownloadService],
  exports: [YoutubeDownloadService], // Export service for potential use in other modules
})
export class YoutubeDownloadModule {}