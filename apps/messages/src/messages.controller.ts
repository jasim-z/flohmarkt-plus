import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@app/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { Types } from 'mongoose';

@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly gateway: MessagesGateway,
  ) {}

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
    const saved = await this.messagesService.sendMessage(conversationId, user._id.toString(), body.text);
    // Broadcast via websocket
    const convRoom = `conv:${conversationId}`;
    this.gateway.server.to(convRoom).emit('message:new', saved);
    const receiverId = (saved.receiverId as Types.ObjectId).toString();
    const totalForReceiver = await this.messagesService.getTotalUnread(receiverId);
    this.gateway.server.to(`user:${receiverId}`).emit('unread:total', { total: totalForReceiver });
    const totalForSender = await this.messagesService.getTotalUnread(user._id.toString());
    this.gateway.server.to(`user:${user._id}`).emit('unread:total', { total: totalForSender });
    return saved;
  }

  @Post('read')
  @Roles('buyer', 'seller', 'admin')
  async markRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    const res = await this.messagesService.markRead(conversationId, user._id.toString());
    // Broadcast read event and updated totals
    this.gateway.server.to(`conv:${conversationId}`).emit('message:read', { conversationId, userId: user._id.toString() });
    const total = await this.messagesService.getTotalUnread(user._id.toString());
    this.gateway.server.to(`user:${user._id}`).emit('unread:total', { total });
    return res;
  }
}

