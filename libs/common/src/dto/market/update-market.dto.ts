import { IsString, IsOptional, IsDateString, IsBoolean, IsArray, IsEnum, IsNumber } from 'class-validator';
import { MarketStatus } from './create-market.dto';

export class UpdateMarketDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsNumber()
  @IsOptional()
  vendorLimit?: number;

  @IsNumber()
  @IsOptional()
  boothsAvailable?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @IsEnum(MarketStatus)
  @IsOptional()
  status?: MarketStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  registeredVendors?: string[];
} 