import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

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
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsBoolean()
  isFree: boolean;

  @IsEnum(ItemCategory)
  category: ItemCategory;

  @IsEnum(ItemCondition)
  condition: ItemCondition;

  @IsString()
  @IsOptional()
  marketId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  city: string;

  @IsString()
  neighborhood: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsEnum(DeliveryOption)
  deliveryOption: DeliveryOption;

  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingCost?: number;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  originalPrice?: number;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsString()
  @IsOptional()
  weight?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;

  @IsString()
  @IsOptional()
  pickupAddress?: string;

  @IsString()
  @IsOptional()
  pickupInstructions?: string;
}
