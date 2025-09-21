import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/,{ message:'buyerId must be a valid ObjectId'})
  buyerId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/,{ message:'sellerId must be a valid ObjectId'})
  sellerId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/,{ message:'listingId must be a valid ObjectId'})
  listingId?: string;
}


