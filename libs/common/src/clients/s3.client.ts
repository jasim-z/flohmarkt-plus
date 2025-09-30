import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3ClientService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'flohmarkt-uploads';
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined, // For MinIO or other S3-compatible services
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || false,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
      },
    });
  }

  /**
   * Generate a presigned URL for uploading a file
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    // Always use the external endpoint for presigned URLs if available
    const externalEndpoint = process.env.S3_EXTERNAL_ENDPOINT;
    
    if (externalEndpoint) {
      const externalS3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: externalEndpoint,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || false,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
        },
      });
      return await getSignedUrl(externalS3Client, command, { expiresIn });
    }

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a presigned URL for downloading/viewing a file
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    // Create a separate S3 client for presigned URLs that uses the external endpoint
    const externalEndpoint = process.env.S3_EXTERNAL_ENDPOINT || process.env.S3_ENDPOINT;
    if (externalEndpoint && externalEndpoint !== process.env.S3_ENDPOINT) {
      const externalS3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: externalEndpoint,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || false,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
        },
      });
      return await getSignedUrl(externalS3Client, command, { expiresIn });
    }

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get the public URL for a file (if bucket is public)
   */
  getPublicUrl(key: string): string {
    if (process.env.S3_ENDPOINT) {
      // For MinIO or other S3-compatible services, use external endpoint for public URLs
      const externalEndpoint = process.env.S3_EXTERNAL_ENDPOINT || process.env.S3_ENDPOINT;
      return `${externalEndpoint}/${this.bucketName}/${key}`;
    }
    
    // For AWS S3
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  /**
   * Generate a unique key for market images
   */
  generateMarketImageKey(
    marketId: string,
    userId: string,
    fileName: string,
    uploadType: 'banner' | 'additional'
  ): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `markets/${marketId}/${uploadType}/${userId}_${timestamp}_${sanitizedFileName}`;
  }

  /**
   * Generate a unique key for user avatars
   */
  generateUserAvatarKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `users/${userId}/avatar_${timestamp}_${sanitizedFileName}`;
  }

  generateListingImageKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const extension = fileName.split('.').pop();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `listings/${userId}/image_${timestamp}_${sanitizedFileName}`;
  }
}

