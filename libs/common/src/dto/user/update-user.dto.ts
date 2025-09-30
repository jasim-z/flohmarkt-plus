import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  @IsUrl({ 
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: true,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    host_whitelist: ['localhost', '127.0.0.1', 'minio']
  }, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
