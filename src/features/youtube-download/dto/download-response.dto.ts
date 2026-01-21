/**
 * Response DTOs for different types of download responses
 */

/**
 * Standard successful download response
 * Used when file is successfully downloaded and ready for streaming
 */
export class DownloadSuccessResponseDto {
  success: boolean;
  message: string;
  fileSize?: number;
  contentType: string;
  filename: string;
}

/**
 * Fallback response when direct download fails
 * Provides direct URLs that can be used by the client
 */
export class DownloadFallbackResponseDto {
  success: boolean;
  directDownload: boolean;
  urls: string[];
  message: string;
  instruction: string;
}

/**
 * Error response for failed downloads
 */
export class DownloadErrorResponseDto {
  error: string;
  details: string;
  suggestion: string;
}

/**
 * Progress update response for Server-Sent Events
 * Used during progressive downloads to send real-time updates
 */
export class ProgressUpdateDto {
  type: 'start' | 'progress' | 'processing' | 'complete' | 'error';
  progress?: number;
  message: string;
  downloadedSize?: number;
  totalSize?: number;
  fileSize?: number;
  downloadUrl?: string;
}