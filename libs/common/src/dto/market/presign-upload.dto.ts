import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export enum UploadType {
  MARKET_BANNER = 'market_banner',
  MARKET_ADDITIONAL = 'market_additional',
  LISTING_IMAGE = 'listing_image',
}

export class PresignUploadDto {
  @IsString()
  @IsNotEmpty({ message: 'File name is required' })
  @Length(1, 255, { message: 'File name must be between 1 and 255 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.]+$/, { 
    message: 'File name can only contain letters, numbers, spaces, hyphens, underscores, and dots' 
  })
  fileName: string;

  @IsString()
  @IsNotEmpty({ message: 'Content type is required' })
  @Matches(/^image\/(jpeg|jpg|png|gif|webp)$/, { 
    message: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' 
  })
  contentType: string;

  @IsEnum(UploadType, { message: 'Invalid upload type' })
  uploadType: UploadType;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Invalid market ID format' })
  marketId?: string; // Optional for banner uploads during creation
}

