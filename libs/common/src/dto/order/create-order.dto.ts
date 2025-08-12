import { IsNotEmpty, IsPositive, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @IsPositive()
  quantity: number;

  @IsPositive()
  totalPrice: number;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}