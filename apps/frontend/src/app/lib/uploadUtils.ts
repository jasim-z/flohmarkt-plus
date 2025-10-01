import { presignUpload, PresignUploadRequest, PresignUploadResponse } from '@/app/api/markets';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  key?: string;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export interface UploadResult {
  file: File;
  url: string;
  key: string;
}

/**
 * Upload a single file using presigned URL
 */
export async function uploadFile(
  file: File,
  uploadType: 'market_banner' | 'market_additional',
  marketId?: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, onSuccess, onError } = options;

  try {
    // Update progress to pending
    onProgress?.({
      file,
      progress: 0,
      status: 'pending'
    });

    // Get presigned URL
    const presignRequest: PresignUploadRequest = {
      fileName: file.name,
      contentType: file.type,
      uploadType,
      marketId
    };

    const presignResponse: PresignUploadResponse = await presignUpload(presignRequest);

    // Update progress to uploading
    onProgress?.({
      file,
      progress: 10,
      status: 'uploading'
    });

    // Upload file to S3 using presigned URL
    const uploadResponse = await fetch(presignResponse.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    // Update progress to success
    const result: UploadResult = {
      file,
      url: presignResponse.downloadUrl,
      key: presignResponse.key
    };

    onProgress?.({
      file,
      progress: 100,
      status: 'success',
      url: result.url,
      key: result.key
    });

    onSuccess?.(result);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    
    onProgress?.({
      file,
      progress: 0,
      status: 'error',
      error: errorMessage
    });

    onError?.(errorMessage);
    throw error;
  }
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadFiles(
  files: File[],
  uploadType: 'market_banner' | 'market_additional',
  marketId?: string,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const progressMap = new Map<string, UploadProgress>();

  // Initialize progress for all files
  files.forEach(file => {
    progressMap.set(file.name, {
      file,
      progress: 0,
      status: 'pending'
    });
  });

  // Upload files sequentially to avoid overwhelming the server
  for (const file of files) {
    try {
      const result = await uploadFile(file, uploadType, marketId, {
        onProgress: (progress) => {
          progressMap.set(file.name, progress);
          options.onProgress?.(progress);
        },
        onSuccess: (result) => {
          results.push(result);
          options.onSuccess?.(result);
        },
        onError: options.onError
      });
      
      results.push(result);
    } catch (error) {
      // Continue with other files even if one fails
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }

  return results;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
    };
  }

  return { isValid: true };
}

/**
 * Generate preview URL for file
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up preview URL
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

