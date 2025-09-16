import { CreateListingDto } from './create-listing.dto';
import { IsOptional, IsEnum } from 'class-validator';

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  DELETED = 'deleted',
  PENDING = 'pending',
  FLAGGED = 'flagged',
}

export class UpdateListingDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  isFree?: boolean;

  @IsOptional()
  category?: string;

  @IsOptional()
  condition?: string;

  @IsOptional()
  images?: string[];

  @IsOptional()
  city?: string;

  @IsOptional()
  neighborhood?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  deliveryOption?: string;

  @IsOptional()
  shippingCost?: number;

  @IsOptional()
  brand?: string;

  @IsOptional()
  model?: string;

  @IsOptional()
  originalPrice?: number;

  @IsOptional()
  dimensions?: string;

  @IsOptional()
  weight?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  isNegotiable?: boolean;

  @IsOptional()
  pickupAddress?: string;

  @IsOptional()
  pickupInstructions?: string;

  @IsOptional()
  @IsEnum(ListingStatus, { message: 'Invalid status' })
  status?: ListingStatus;
}
