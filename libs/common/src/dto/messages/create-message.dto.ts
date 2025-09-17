import { IsString, Length, Matches } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/,{ message:'conversationId must be a valid ObjectId'})
  conversationId!: string;

  @IsString()
  @Length(1, 2000, { message: 'Message text must be between 1 and 2000 characters' })
  text!: string;
}


