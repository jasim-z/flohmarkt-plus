import {
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsInt,
  IsPositive,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ItemCategory, ItemCondition, DeliveryOption } from './create-listing.dto';

export class QueryListingDto {
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'price', 'title', 'viewCount', 'favoriteCount'], {
    message: 'Invalid sortBy field'
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either "asc" or "desc"' })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(ItemCategory, { message: 'Invalid category' })
  category?: ItemCategory;

  @IsOptional()
  @IsEnum(ItemCondition, { message: 'Invalid condition' })
  condition?: ItemCondition;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'minPrice must be a valid number' })
  @Min(0, { message: 'minPrice must be 0 or greater' })
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'maxPrice must be a valid number' })
  @Min(0, { message: 'maxPrice must be 0 or greater' })
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  city?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  neighborhood?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isNegotiable?: boolean;

  @IsOptional()
  @IsEnum(DeliveryOption, { message: 'Invalid delivery option' })
  deliveryOption?: DeliveryOption;
}

export class NearbyListingDto extends QueryListingDto {
  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'Invalid latitude format' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  @Type(() => Number)
  latitude: number;

  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'Invalid longitude format' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Invalid radius format' })
  @Min(0.1, { message: 'Radius must be at least 0.1 km' })
  @Max(100, { message: 'Radius must not exceed 100 km' })
  @Type(() => Number)
  radius?: number = 10;
}

export class SearchListingDto extends QueryListingDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  q: string;
}
