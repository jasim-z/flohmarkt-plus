import { Body, Controller, Get, Post, Query, UseGuards, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@app/common';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from '@app/common/dto/messages/create-conversation.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: true } }))
export class ConversationsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles('buyer', 'seller', 'admin')
  async getOrCreate(@Body() body: CreateConversationDto, @CurrentUser() user: any) {
    return this.messagesService.getOrCreateConversation(user._id.toString(), body);
  }

  @Get()
  @Roles('buyer', 'seller', 'admin')
  async list(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.messagesService.listConversations(user._id.toString(), Number(page), Number(limit));
  }

  @Get('unread-count')
  @Roles('buyer', 'seller', 'admin')
  async unreadCount(@CurrentUser() user: any) {
    const total = await this.messagesService.getTotalUnread(user._id.toString());
    return { total };
  }
}

