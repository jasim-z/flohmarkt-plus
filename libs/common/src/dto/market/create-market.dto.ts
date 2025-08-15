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
} from 'class-validator';
import { IsVendorBoothRatioValid } from '../validators/vendor-booth-ratio.validator';

export enum MarketStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  PAST = 'past',
}

export class CreateMarketDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsDateString()
  date: Date;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  createdBy: string; // admin user id (ObjectId as string)

  @IsString()
  bannerImage: string;

  @IsNumber()
  @IsOptional()
  vendorLimit?: number;

  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => o.vendorLimit !== undefined)
  @Validate(IsVendorBoothRatioValid)
  boothsAvailable?: number;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsEnum(MarketStatus)
  status: MarketStatus;

  @IsArray()
  @IsString({ each: true })
  registeredVendors: string[]; // seller user IDs (ObjectId as string)

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
} 