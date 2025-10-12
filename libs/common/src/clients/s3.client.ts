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
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get the public URL for a file (if bucket is public)
   */
  getPublicUrl(key: string): string {
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

