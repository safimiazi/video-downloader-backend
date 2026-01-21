import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data Transfer Object for YouTube video download requests
 * 
 * This DTO validates and transforms incoming request parameters
 * to ensure they meet the required format and constraints.
 */
export class DownloadRequestDto {
  /**
   * YouTube video or Shorts URL to download
   * Must be a valid string (URL validation can be added if needed)
   * Supports: youtube.com/watch, youtu.be, youtube.com/shorts, etc.
   */
  @IsString()
  url: string;

  /**
   * Video quality preference
   * Supported values: 0 (for audio only), 144, 240, 360, 480, 720, 1080, 1440, 2160
   * Default: 720p
   */
  @IsOptional()
  @IsIn(['0', '144', '240', '360', '480', '720', '1080', '1440', '2160'])
  quality?: string = '720';

  /**
   * Whether to download audio only (MP3 format)
   * Default: false (downloads video with audio)
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  audioOnly?: boolean = false;

  /**
   * Whether to enable progressive download with real-time progress updates
   * When true, returns Server-Sent Events stream with download progress
   * Default: false
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  progress?: boolean = false;
}