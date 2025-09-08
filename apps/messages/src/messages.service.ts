import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  private ensureParticipant(conv: ConversationDocument, userId: string) {
    const ok = conv.participantIds.some(id => id.toString() === userId);
    if (!ok) throw new ForbiddenException('Not a participant');
  }

  async getOrCreateConversation(requesterId: string, body: { buyerId?: string; sellerId?: string; listingId?: string }) {
    const { buyerId, sellerId, listingId } = body;
    const participants = [buyerId || requesterId, sellerId].filter(Boolean) as string[];
    if (participants.length < 2) throw new ForbiddenException('buyerId and sellerId required');
    const participantIds = participants.map(id => new Types.ObjectId(id));

    const query: any = { participantIds: { $all: participantIds } };
    if (listingId) query.listingId = new Types.ObjectId(listingId);

    const existing = await this.conversationModel.findOne(query).lean();
    if (existing) {
      this.ensureParticipant(existing as any, requesterId);
      return existing;
    }
    const toCreate: Partial<Conversation> = {
      participantIds: participantIds as any,
      listingId: listingId ? new Types.ObjectId(listingId) as any : undefined,
      lastMessageAt: new Date(),
      unreadCounts: { buyer: 0, seller: 0 },
    };
    const created = await this.conversationModel.create(toCreate);
    return created.toJSON();
  }

  async listConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const filter = { participantIds: new Types.ObjectId(userId) };
    const [data, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.conversationModel.countDocuments(filter),
    ]);
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }

  async listMessages(conversationId: string, userId: string, page = 1, limit = 20) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    this.ensureParticipant(conv as any, userId);

    const skip = (page - 1) * limit;
    const filter = { conversationId: new Types.ObjectId(conversationId) };
    const [data, total] = await Promise.all([
      this.messageModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.messageModel.countDocuments(filter),
    ]);
    return { data: data.reverse(), pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    this.ensureParticipant(conv as any, senderId);

    // Determine receiver
    const receiverId = conv.participantIds.map(id => id.toString()).find(id => id !== senderId)!;
    const msg = await this.messageModel.create({ conversationId: new Types.ObjectId(conversationId), senderId: new Types.ObjectId(senderId), receiverId: new Types.ObjectId(receiverId), text, status: 'sent' });

    await this.conversationModel.updateOne(
      { _id: conv._id },
      { $set: { lastMessage: text, lastMessageAt: new Date() } }
    );

    return msg;
  }
}

