import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMarketDto } from './create-market.dto';

export class BulkCreateMarketDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one market is required' })
  @ArrayMaxSize(100, { message: 'Cannot create more than 100 markets at once' })
  @ValidateNested({ each: true })
  @Type(() => CreateMarketDto)
  @IsNotEmpty({ each: true })
  markets: CreateMarketDto[];
}
