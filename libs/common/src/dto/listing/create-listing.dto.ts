import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
  Length,
  IsUrl,
  IsLatitude,
  IsLongitude,
  Matches,
  ArrayMaxSize,
  IsNotEmpty,
  ValidateIf,
  IsPositive,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum ItemCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ItemCategory {
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  SPORTS = 'sports',
  TOYS = 'toys',
  HOME_GARDEN = 'home_garden',
  AUTOMOTIVE = 'automotive',
  COLLECTIBLES = 'collectibles',
  ART = 'art',
  MUSIC = 'music',
  TOOLS = 'tools',
  BABY_KIDS = 'baby_kids',
  PETS = 'pets',
  OTHER = 'other',
}

export enum DeliveryOption {
  PICKUP_ONLY = 'pickup_only',
  LOCAL_DELIVERY = 'local_delivery',
  SHIPPING = 'shipping',
}

export class CreateListingDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-.,!?()]+$/, { 
    message: 'Title contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed.' 
  })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Matches(/^[a-zA-Z0-9\s\-.,!?()@#$%&*+=<>:"'`~[\]{}|\\/]+$/, { 
    message: 'Description contains invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number with max 2 decimal places' })
  @Min(0, { message: 'Price must be 0 or greater' })
  @Max(999999.99, { message: 'Price must not exceed 999,999.99' })
  @ValidateIf((o) => !o.isFree)
  @IsNotEmpty({ message: 'Price is required when item is not free' })
  @Type(() => Number)
  price: number;

  @IsBoolean()
  isFree: boolean;

  @IsEnum(ItemCategory, { message: 'Invalid category selected' })
  category: ItemCategory;

  @IsEnum(ItemCondition, { message: 'Invalid condition selected' })
  condition: ItemCondition;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Invalid market ID format' })
  marketId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(10, { message: 'Maximum 10 images allowed' })
  @IsUrl({}, { each: true, message: 'Each image must be a valid URL' })
  images?: string[];

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  @MaxLength(50, { message: 'City must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s\-'.,]+$/, { 
    message: 'City contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed.' 
  })
  @Transform(({ value }) => value?.trim())
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Neighborhood is required' })
  @MinLength(2, { message: 'Neighborhood must be at least 2 characters long' })
  @MaxLength(50, { message: 'Neighborhood must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,]+$/, { 
    message: 'Neighborhood contains invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  neighborhood: string;

  @IsLatitude({ message: 'Invalid latitude value' })
  @Type(() => Number)
  latitude: number;

  @IsLongitude({ message: 'Invalid longitude value' })
  @Type(() => Number)
  longitude: number;

  @IsEnum(DeliveryOption, { message: 'Invalid delivery option selected' })
  deliveryOption: DeliveryOption;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Shipping cost must be a valid number with max 2 decimal places' })
  @IsOptional()
  @Min(0, { message: 'Shipping cost must be 0 or greater' })
  @Max(999.99, { message: 'Shipping cost must not exceed 999.99' })
  @ValidateIf((o) => o.deliveryOption === DeliveryOption.SHIPPING)
  @Type(() => Number)
  shippingCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Brand must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,&]+$/, { 
    message: 'Brand contains invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Model must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,&()]+$/, { 
    message: 'Model contains invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  model?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Original price must be a valid number with max 2 decimal places' })
  @IsOptional()
  @Min(0, { message: 'Original price must be 0 or greater' })
  @Max(999999.99, { message: 'Original price must not exceed 999,999.99' })
  @Type(() => Number)
  originalPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Dimensions must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,x×]+$/, { 
    message: 'Dimensions contains invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  dimensions?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Weight must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,kg]+$/, { 
    message: 'Weight contains invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  weight?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  @MaxLength(30, { each: true, message: 'Each tag must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,]+$/, { 
    each: true, 
    message: 'Each tag contains invalid characters.' 
  })
  @Transform(({ value }) => value?.map((tag: string) => tag?.trim()).filter(Boolean))
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Pickup address must not exceed 200 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,#/]+$/, { 
    message: 'Pickup address contains invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  pickupAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Pickup instructions must not exceed 500 characters' })
  @Matches(/^[a-zA-Z0-9\s\-'.,!?()@#$%&*+=<>:"'`~[\]{}|\\/]+$/, { 
    message: 'Pickup instructions contain invalid characters.' 
  })
  @Transform(({ value }) => value?.trim())
  pickupInstructions?: string;
}
