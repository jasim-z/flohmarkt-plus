import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
  ValidateIf,
  Validate,
  Length,
  Matches,
  IsUrl,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
} from 'class-validator';
import { IsVendorBoothRatioValid } from '../validators/vendor-booth-ratio.validator';

export enum MarketStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  PAST = 'past',
}

export class CreateMarketDto {
  @IsString()
  @IsNotEmpty({ message: 'Market name is required' })
  @Length(2, 100, { message: 'Market name must be between 2 and 100 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Market description is required' })
  @Length(10, 1000, { message: 'Market description must be between 10 and 1000 characters' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'Market location is required' })
  @Length(5, 200, { message: 'Market location must be between 5 and 200 characters' })
  location: string;

  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Market date is required' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: 'Start time is required' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:MM format' })
  startTime: string;

  @IsString()
  @IsNotEmpty({ message: 'End time is required' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:MM format' })
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Created by must be a valid ObjectId' })
  createdBy?: string; // admin user id (ObjectId as string)

  @IsString()
  @IsNotEmpty({ message: 'Banner image is required' })
  @IsUrl({ 
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: true,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    host_whitelist: ['localhost', '127.0.0.1', 'minio', 'flohmarkt-uploads-bucket.s3.eu-central-1.amazonaws.com']
  }, { message: 'Banner image must be a valid URL' })
  bannerImage: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(3, { message: 'Maximum 3 additional images allowed' })
  @IsUrl({ 
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: true,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    host_whitelist: ['localhost', '127.0.0.1', 'minio', 'flohmarkt-uploads-bucket.s3.eu-central-1.amazonaws.com']
  }, { each: true, message: 'Each additional image must be a valid URL' })
  additionalImages?: string[];

  @IsNumber()
  @Min(1, { message: 'Vendor limit must be at least 1' })
  @Max(1000, { message: 'Vendor limit cannot exceed 1000' })
  @IsOptional()
  vendorLimit?: number;

  @IsNumber()
  @Min(1, { message: 'Booths available must be at least 1' })
  @Max(1000, { message: 'Booths available cannot exceed 1000' })
  @IsOptional()
  @ValidateIf((o) => o.vendorLimit !== undefined)
  @Validate(IsVendorBoothRatioValid)
  boothsAvailable?: number;

  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  @Max(999999.99, { message: 'Price cannot exceed 999,999.99' })
  @IsOptional()
  price?: number; // Will be converted to Decimal128 in the backend, defaults to 0

  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 categories' })
  @IsString({ each: true })
  @Length(2, 50, { each: true, message: 'Each category must be between 2 and 50 characters' })
  @IsOptional()
  categories?: string[];

  @IsEnum(MarketStatus, { message: 'Status must be one of: upcoming, ongoing, past' })
  @IsOptional()
  status?: MarketStatus;

  @IsArray()
  @ArrayMaxSize(1000, { message: 'Cannot have more than 1000 registered vendors' })
  @IsString({ each: true })
  @Matches(/^[0-9a-fA-F]{24}$/, { each: true, message: 'Each registered vendor ID must be a valid ObjectId' })
  @IsOptional()
  registeredVendors?: string[]; // seller user IDs (ObjectId as string)

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
} 