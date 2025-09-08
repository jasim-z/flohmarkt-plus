import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@app/common';
import { MessagesService } from './messages.service';

@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Roles('buyer', 'seller', 'admin')
  async list(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.messagesService.listMessages(conversationId, user._id.toString(), Number(page), Number(limit));
  }

  @Post()
  @Roles('buyer', 'seller', 'admin')
  async send(
    @Param('conversationId') conversationId: string,
    @Body() body: { text: string },
    @CurrentUser() user: any,
  ) {
    return this.messagesService.sendMessage(conversationId, user._id.toString(), body.text);
  }

  @Post('read')
  @Roles('buyer', 'seller', 'admin')
  async markRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.markRead(conversationId, user._id.toString());
  }
}

