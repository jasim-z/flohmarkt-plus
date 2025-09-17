import {
  IsString,
  IsObject,
  IsOptional,
  ValidateNested,
  IsEnum,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PaymentMethod {
  CARD = 'card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export class CardDetailsDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @Matches(/^[0-9]{13,19}$/i, { message: 'Card number must be 13-19 digits' })
  cardNumber: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, { message: 'Expiry date must be in MM/YY format' })
  expiryDate: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @Matches(/^[0-9]{3,4}$/i, { message: 'CVV must be 3-4 digits' })
  cvv: string;

  @IsString()
  @Matches(/^[a-zA-Z\s]{2,50}$/, { message: 'Cardholder name must be 2-50 characters' })
  cardholderName: string;
}

export class JoinMarketDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CARD)
  @IsObject()
  @ValidateNested()
  @Type(() => CardDetailsDto)
  cardDetails?: CardDetailsDto;
}
