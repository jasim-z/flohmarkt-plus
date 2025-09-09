import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { Types } from 'mongoose';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) return client.disconnect(true);
      const payload: any = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      if (!payload?.userId) return client.disconnect(true);
      client.data.userId = payload.userId;
      client.join(this.userRoom(payload.userId));
    } catch (err) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // no-op for now
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    const fromAuth = (client.handshake as any)?.auth?.token;
    if (typeof fromAuth === 'string') return fromAuth;
    const fromQuery = (client.handshake.query?.token as string) || null;
    return fromQuery;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
  private conversationRoom(conversationId: string) {
    return `conv:${conversationId}`;
  }

  @SubscribeMessage('conversation:join')
  async onConversationJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.data.userId) return;
    client.join(this.conversationRoom(data.conversationId));
  }

  @SubscribeMessage('conversation:leave')
  async onConversationLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.data.userId) return;
    client.leave(this.conversationRoom(data.conversationId));
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; text: string },
  ) {
    if (!client.data.userId) return;
    const senderId = client.data.userId as string;
    const saved = await this.messagesService.sendMessage(
      data.conversationId,
      senderId,
      data.text,
    );

    // Broadcast new message to conversation room
    this.server
      .to(this.conversationRoom(data.conversationId))
      .emit('message:new', saved);

    // Update unread count for receiver
    const receiverId = (saved.receiverId as Types.ObjectId).toString();
    const total = await this.messagesService.getTotalUnread(receiverId);
    this.server.to(this.userRoom(receiverId)).emit('unread:total', { total });

    // Echo back to sender to confirm delivery
    const senderTotal = await this.messagesService.getTotalUnread(senderId);
    this.server.to(this.userRoom(senderId)).emit('unread:total', { total: senderTotal });
    return saved;
  }

  @SubscribeMessage('message:read')
  async onMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.data.userId) return;
    const userId = client.data.userId as string;
    await this.messagesService.markRead(data.conversationId, userId);
    // Notify conversation participants
    this.server
      .to(this.conversationRoom(data.conversationId))
      .emit('message:read', { conversationId: data.conversationId, userId });
    // Update unread totals for this user
    const total = await this.messagesService.getTotalUnread(userId);
    this.server.to(this.userRoom(userId)).emit('unread:total', { total });
    return { success: true };
  }
}

