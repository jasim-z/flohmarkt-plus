import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MessagesService } from './messages.service';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

function objectIdHex() {
  return new Types.ObjectId().toHexString();
}

describe('MessagesService (unit)', () => {
  let service: MessagesService;
  let conversationModel: any;
  let messageModel: any;

  const buyerId = objectIdHex();
  const sellerId = objectIdHex();
  const convId = objectIdHex();

  beforeEach(async () => {
    conversationModel = {
      findOne: jest.fn().mockReturnValue({ lean: jest.fn() }),
      create: jest.fn(),
      updateOne: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }) }),
      countDocuments: jest.fn(),
      findById: jest.fn(),
    };

    messageModel = {
      countDocuments: jest.fn(),
      create: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn() }) }) }) }),
      updateMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getModelToken(Conversation.name), useValue: conversationModel },
        { provide: getModelToken(Message.name), useValue: messageModel },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('getOrCreateConversation', () => {
    it('throws if participants missing', async () => {
      await expect(
        service.getOrCreateConversation(buyerId, { buyerId })
      ).rejects.toThrow('buyerId and sellerId required');
    });

    it('returns existing conversation and bumps lastMessageAt', async () => {
      const existing = { _id: new Types.ObjectId(convId), participantIds: [new Types.ObjectId(buyerId), new Types.ObjectId(sellerId)] };
      conversationModel.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce(existing) });
      conversationModel.updateOne.mockResolvedValueOnce({});

      const res = await service.getOrCreateConversation(buyerId, { buyerId, sellerId });
      expect(res).toBe(existing);
      expect(conversationModel.updateOne).toHaveBeenCalledWith({ _id: existing._id }, expect.any(Object));
    });

    it('creates conversation when none exists', async () => {
      conversationModel.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce(null) });
      conversationModel.create.mockResolvedValueOnce({ toJSON: () => ({ _id: convId, participantIds: [buyerId, sellerId] }) });

      const res = await service.getOrCreateConversation(buyerId, { buyerId, sellerId });
      expect(conversationModel.create).toHaveBeenCalled();
      expect(res._id).toBe(convId);
    });
  });

  describe('listConversations', () => {
    it('returns paginated conversations with unread counts', async () => {
      const convs = [{ _id: new Types.ObjectId(convId) }];
      conversationModel.find().sort().skip().limit().lean.mockResolvedValueOnce(convs);
      conversationModel.countDocuments.mockResolvedValueOnce(1);
      messageModel.countDocuments.mockResolvedValueOnce(0);

      const res = await service.listConversations(buyerId, 1, 20);
      expect(res.pagination.total).toBe(1);
      expect(res.data[0].unreadCount).toBe(0);
    });
  });

  describe('listMessages', () => {
    it('throws if conversation not found', async () => {
      conversationModel.findById.mockResolvedValueOnce(null);
      await expect(service.listMessages(convId, buyerId, 1, 20)).rejects.toThrow('Conversation not found');
    });

    it('enforces participant membership', async () => {
      const conv = { _id: new Types.ObjectId(convId), participantIds: [new Types.ObjectId(sellerId), new Types.ObjectId()] };
      conversationModel.findById.mockResolvedValueOnce(conv);
      await expect(service.listMessages(convId, buyerId, 1, 20)).rejects.toThrow('Not a participant');
    });

    it('returns messages with pagination', async () => {
      const conv = { _id: new Types.ObjectId(convId), participantIds: [new Types.ObjectId(sellerId), new Types.ObjectId(buyerId)] };
      conversationModel.findById.mockResolvedValueOnce(conv);
      const msgs = [{ _id: new Types.ObjectId(), text: 'hi' }];
      messageModel.find().sort().skip().limit().lean.mockResolvedValueOnce(msgs);
      messageModel.countDocuments.mockResolvedValueOnce(1);

      const res = await service.listMessages(convId, buyerId, 1, 20);
      expect(res.pagination.total).toBe(1);
      expect(res.data.length).toBe(1);
    });
  });

  describe('sendMessage', () => {
    it('throws if conversation not found', async () => {
      conversationModel.findById.mockResolvedValueOnce(null);
      await expect(service.sendMessage(convId, buyerId, 'hello')).rejects.toThrow('Conversation not found');
    });

    it('enforces participant membership and updates lastMessage', async () => {
      const conv = { _id: new Types.ObjectId(convId), participantIds: [new Types.ObjectId(buyerId), new Types.ObjectId(sellerId)] };
      conversationModel.findById.mockResolvedValueOnce(conv);
      const created = { _id: new Types.ObjectId(), conversationId: conv._id, senderId: new Types.ObjectId(buyerId), receiverId: new Types.ObjectId(sellerId), text: 'hello' };
      messageModel.create.mockResolvedValueOnce(created);
      conversationModel.updateOne.mockResolvedValueOnce({});

      const res = await service.sendMessage(convId, buyerId, 'hello');
      expect(res).toBe(created);
      expect(conversationModel.updateOne).toHaveBeenCalledWith({ _id: conv._id }, expect.objectContaining({ $set: expect.objectContaining({ lastMessage: 'hello' }) }));
    });
  });

  describe('markRead', () => {
    it('throws if conversation not found', async () => {
      conversationModel.findById.mockResolvedValueOnce(null);
      await expect(service.markRead(convId, buyerId)).rejects.toThrow('Conversation not found');
    });

    it('marks messages as read for receiver', async () => {
      conversationModel.findById.mockResolvedValueOnce({ _id: new Types.ObjectId(convId), participantIds: [new Types.ObjectId(buyerId), new Types.ObjectId(sellerId)] });
      messageModel.updateMany.mockResolvedValueOnce({});
      const res = await service.markRead(convId, buyerId);
      expect(res).toEqual({ success: true });
      expect(messageModel.updateMany).toHaveBeenCalled();
    });
  });

  describe('getTotalUnread', () => {
    it('returns count of unread messages', async () => {
      messageModel.countDocuments.mockResolvedValueOnce(3);
      const total = await service.getTotalUnread(buyerId);
      expect(total).toBe(3);
    });
  });
});
