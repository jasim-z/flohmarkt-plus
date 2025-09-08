import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@app/common';
import { MessagesService } from './messages.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles('buyer', 'seller', 'admin')
  async getOrCreate(@Body() body: { buyerId?: string; sellerId?: string; listingId?: string }, @CurrentUser() user: any) {
    return this.messagesService.getOrCreateConversation(user._id.toString(), body);
  }

  @Get()
  @Roles('buyer', 'seller', 'admin')
  async list(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.messagesService.listConversations(user._id.toString(), Number(page), Number(limit));
  }
}

