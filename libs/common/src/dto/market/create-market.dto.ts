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
} from 'class-validator';

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
  boothsAvailable?: number;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsEnum(MarketStatus)
  status: MarketStatus;

  @IsArray()
  @IsString({ each: true })
  registeredVendors: string[]; // seller user IDs (ObjectId as string)
} 