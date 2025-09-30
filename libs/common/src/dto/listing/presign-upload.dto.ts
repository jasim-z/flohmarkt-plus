import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';

export class PresignListingUploadDto {
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
}
