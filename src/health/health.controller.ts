import { Controller, Get } from '@nestjs/common';

/**
 * Health Check Controller
 * 
 * Provides health check endpoints for monitoring and deployment verification.
 * Used by Render and other deployment platforms to verify service health.
 */
@Controller('health')
export class HealthController {
  
  /**
   * Basic health check endpoint
   * Returns service status and timestamp
   */
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'video-downloader-backend',
      version: '1.0.0'
    };
  }

  /**
   * Detailed health check with system information
   */
  @Get('detailed')
  getDetailedHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'video-downloader-backend',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}