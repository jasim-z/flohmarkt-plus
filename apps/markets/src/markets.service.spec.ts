import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { MarketsService } from './markets.service';
import { MarketsRepository } from './markets.repository';
import { MarketDocument } from './schemas/market.schema';

const adminUser = { userId: new Types.ObjectId().toHexString(), role: 'admin' };
const sellerUser = { userId: new Types.ObjectId().toHexString(), role: 'seller' };

describe('MarketsService (unit)', () => {
  let service: MarketsService;
  let marketsRepository: jest.Mocked<MarketsRepository>;
  let marketModel: any;

  beforeEach(async () => {
    marketsRepository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    } as any;

    marketModel = {
      countDocuments: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({ exec: jest.fn() }),
            }),
          }),
        }),
      }),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketsService,
        { provide: MarketsRepository, useValue: marketsRepository },
        { provide: getModelToken('Market'), useValue: marketModel },
        { provide: 'USERS_SERVICE_CLIENT', useValue: { getUsersByIds: jest.fn() } },
        { provide: 'DatabaseConnection', useValue: { collection: jest.fn().mockReturnValue({ findOne: jest.fn(), find: jest.fn().mockReturnValue({ project: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }) }) }) } },
      ],
    }).compile();

    service = module.get<MarketsService>(MarketsService);
  });

  describe('create', () => {
    it('allows admin to create market and enforces vendorLimit=boothsAvailable', async () => {
      marketsRepository.create.mockResolvedValueOnce({ _id: new Types.ObjectId() } as any);

      const dto: any = {
        name: 'Test Market',
        description: 'Desc',
        location: 'City',
        date: '2099-12-31',
        startTime: '10:00',
        endTime: '18:00',
        vendorLimit: 20,
        boothsAvailable: 20,
        categories: ['Crafts'],
      };

      const result = await service.create(dto, adminUser);

      expect(marketsRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        vendorLimit: 20,
        boothsAvailable: 20,
        createdBy: expect.any(Types.ObjectId),
      }));
      expect(result).toBeDefined();
    });

    it('rejects non-admin user', async () => {
      await expect(service.create({} as any, sellerUser)).rejects.toThrow('Only admins can create markets');
    });

    it('auto-aligns missing boothsAvailable to vendorLimit', async () => {
      marketsRepository.create.mockResolvedValueOnce({ _id: new Types.ObjectId() } as any);
      const dto: any = {
        name: 'Test', description: 'd', location: 'c', date: '2099-12-31', startTime: '09:00', endTime: '10:00', vendorLimit: 5,
      };
      await service.create(dto, adminUser);
      expect(marketsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ vendorLimit: 5, boothsAvailable: 5 }));
    });
  });

  describe('findAll', () => {
    it('returns paginated markets for non-admin with default filters', async () => {
      marketModel.countDocuments.mockResolvedValueOnce(1);
      (marketModel.find().sort().skip().limit().lean().exec as jest.Mock).mockResolvedValueOnce([
        { _id: new Types.ObjectId(), name: 'M1', price: { toString: () => '0' }, categories: [], registeredVendors: [] },
      ]);

      const result = await service.findAll({ page: 1, limit: 10, userRole: 'seller' });
      expect(result.pagination.total).toBe(1);
      expect(result.data[0].name).toBe('M1');
    });
  });

  describe('findOne', () => {
    it('fetches a non-deleted market or throws', async () => {
      const marketId = new Types.ObjectId().toHexString();
      marketsRepository.findOne.mockResolvedValueOnce({ _id: new Types.ObjectId(marketId), isDeleted: false } as any);
      const m = await service.findOne(marketId);
      expect(m).toBeDefined();

      marketsRepository.findOne.mockResolvedValueOnce(null as any);
      await expect(service.findOne(marketId)).rejects.toThrow('Market not found');
    });
  });

  describe('joinMarket', () => {
    it('adds user if space available and not already registered', async () => {
      const marketId = new Types.ObjectId().toHexString();
      const uid = new Types.ObjectId().toHexString();
      marketsRepository.findOne.mockResolvedValueOnce({
        _id: new Types.ObjectId(marketId),
        isActive: true,
        registeredVendors: [],
        vendorLimit: 2,
      } as any);
      marketsRepository.findOneAndUpdate.mockResolvedValueOnce({ _id: new Types.ObjectId(marketId) } as any);

      const res = await service.joinMarket(marketId, uid, { method: 'mock' });
      expect(res.success).toBe(true);
      expect(marketsRepository.findOneAndUpdate).toHaveBeenCalled();
    });

    it('throws if market not found', async () => {
      marketsRepository.findOne.mockResolvedValueOnce(null as any);
      await expect(service.joinMarket(new Types.ObjectId().toHexString(), new Types.ObjectId().toHexString(), {})).rejects.toThrow('Market not found or inactive');
    });

    it('throws if already registered', async () => {
      const uid = new Types.ObjectId().toHexString();
      marketsRepository.findOne.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        isActive: true,
        registeredVendors: { includes: jest.fn().mockReturnValue(true), length: 0 },
      } as any);
      await expect(service.joinMarket(new Types.ObjectId().toHexString(), uid, {})).rejects.toThrow('User is already registered for this market');
    });

    it('throws if market full', async () => {
      marketsRepository.findOne.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        isActive: true,
        registeredVendors: [new Types.ObjectId(), new Types.ObjectId()],
        vendorLimit: 2,
      } as any);
      await expect(service.joinMarket(new Types.ObjectId().toHexString(), new Types.ObjectId().toHexString(), {})).rejects.toThrow('Market is full - no available vendor slots');
    });
  });
});
