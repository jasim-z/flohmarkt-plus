import {
  IsString,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';

export class UploadImageDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, { message: 'Image name can only contain letters, numbers, spaces, hyphens, and underscores' })
  name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, { message: 'Category can only contain letters, numbers, spaces, hyphens, and underscores' })
  category?: string;
}

export class FileUploadValidation {
  static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  static validateFileType(mimetype: string): boolean {
    return this.ALLOWED_MIME_TYPES.includes(mimetype);
  }

  static validateFileSize(size: number): boolean {
    return size <= this.MAX_FILE_SIZE;
  }

  static getErrorMessage(mimetype: string, size: number): string | null {
    if (!this.validateFileType(mimetype)) {
      return `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`;
    }
    
    if (!this.validateFileSize(size)) {
      return `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    return null;
  }
}
