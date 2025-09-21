import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsDateString,
  Matches,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum MarketSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  DATE = 'date',
  LOCATION = 'location',
  STATUS = 'status',
  VENDOR_LIMIT = 'vendorLimit',
  PRICE = 'price',
}

export enum MarketSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum QueryMarketStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  PAST = 'past',
  ALL = 'all',
}

export class QueryMarketDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @IsOptional()
  @IsEnum(MarketSortBy)
  sortBy?: MarketSortBy = MarketSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(MarketSortOrder)
  sortOrder?: MarketSortOrder = MarketSortOrder.DESC;

  @IsOptional()
  @IsEnum(QueryMarketStatus)
  status?: QueryMarketStatus;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  location?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  minVendorLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxVendorLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'userId must be a valid ObjectId' })
  userId?: string;

  @IsOptional()
  @IsString()
  userRole?: string;
}
