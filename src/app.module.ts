import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YoutubeDownloadModule } from './features/youtube-download/youtube-download.module';
import { HealthController } from './health/health.controller';

/**
 * Root application module that imports all feature modules
 * Uses modular architecture where each feature is organized in its own module
 */
@Module({
  imports: [
    // Global configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Feature modules - each video platform has its own module
    YoutubeDownloadModule,
    
    // Future modules can be added here:
    // TikTokDownloadModule,
    // FacebookDownloadModule,
    // InstagramDownloadModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}