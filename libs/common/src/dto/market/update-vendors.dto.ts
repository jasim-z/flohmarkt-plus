import {
  IsArray,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
} from 'class-validator';

export class UpdateRegisteredVendorsDto {
  @IsArray()
  @ArrayMinSize(0, { message: 'Vendor list cannot be negative' })
  @ArrayMaxSize(1000, { message: 'Cannot have more than 1000 vendors' })
  @IsString({ each: true })
  @Matches(/^[0-9a-fA-F]{24}$/, { each: true, message: 'Each userId must be a valid ObjectId' })
  userIds: string[];
}
