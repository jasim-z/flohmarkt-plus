import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ListingsService } from './listings.service';
import { Listing, ListingDocument, ListingStatus } from './schemas/listing.schema';
import { CreateListingDto } from '@app/common';

describe('ListingsService (unit)', () => {
  let service: ListingsService;
  let listingModel: jest.Mocked<Model<ListingDocument>>;

  const mockListing = {
    _id: new Types.ObjectId(),
    title: 'Test Item',
    description: 'Test description',
    price: 100,
    category: 'electronics',
    condition: 'good',
    sellerId: new Types.ObjectId(),
    status: ListingStatus.ACTIVE,
    isActive: true,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockListingInstance = {
      save: jest.fn().mockResolvedValue(mockListing),
    };

    const mockModel = jest.fn(() => mockListingInstance) as any;
    mockModel.save = jest.fn();
    mockModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockModel.aggregate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    });
    mockModel.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: getModelToken(Listing.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    listingModel = module.get(getModelToken(Listing.name)) as any;
  });

  describe('create', () => {
    it('creates listing with sanitized data and sets sellerId', async () => {
      const createDto: CreateListingDto = {
        title: 'Test Item',
        description: 'Test description',
        price: 100,
        category: 'electronics',
        condition: 'good',
      } as any;

      const result = await service.create(createDto, '64b0f2f8d2f5b3a4c1e2d3f4');

      expect(listingModel).toHaveBeenCalled();
      expect(result).toEqual(mockListing);
    });

    it('converts marketId to ObjectId when provided', async () => {
      const createDto: CreateListingDto = {
        title: 'Test Item',
        marketId: '64b0f2f8d2f5b3a4c1e2d3f5',
      } as any;

      await service.create(createDto, '64b0f2f8d2f5b3a4c1e2d3f4');

      expect(listingModel).toHaveBeenCalledWith(
        expect.objectContaining({
          marketId: expect.any(Types.ObjectId),
          sellerId: expect.any(Types.ObjectId),
          status: ListingStatus.ACTIVE,
        })
      );
    });
  });

  describe('findOne', () => {
    it('returns listing and increments view count', async () => {
      const findByIdMock = listingModel.findById as jest.Mock;
      const findByIdAndUpdateMock = listingModel.findByIdAndUpdate as jest.Mock;
      
      findByIdMock().exec.mockResolvedValueOnce(mockListing);
      findByIdAndUpdateMock().exec.mockResolvedValueOnce(mockListing);

      const result = await service.findOne('64b0f2f8d2f5b3a4c1e2d3f4');

      expect(findByIdMock).toHaveBeenCalledWith('64b0f2f8d2f5b3a4c1e2d3f4');
      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        '64b0f2f8d2f5b3a4c1e2d3f4',
        { $inc: { viewCount: 1 } }
      );
      expect(result).toEqual(mockListing);
    });

    it('returns null when listing not found', async () => {
      const findByIdMock = listingModel.findById as jest.Mock;
      findByIdMock().exec.mockResolvedValueOnce(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
      expect(listingModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated results with filters', async () => {
      const aggregateMock = listingModel.aggregate as jest.Mock;
      aggregateMock().exec
        .mockResolvedValueOnce([{ total: 25 }])
        .mockResolvedValueOnce([mockListing]);

      const query = {
        category: 'electronics' as any,
        minPrice: 50,
        maxPrice: 200,
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: [mockListing],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('applies price range filter correctly', async () => {
      const aggregateMock = listingModel.aggregate as jest.Mock;
      aggregateMock().exec
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await service.findAll({ minPrice: 100, maxPrice: 500 });

      expect(aggregateMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              price: { $gte: 100, $lte: 500 },
            }),
          }),
        ])
      );
    });
  });

  describe('update', () => {
    it('updates listing when user is owner', async () => {
      const updateDto = { title: 'Updated Title' };
      const sellerId = '64b0f2f8d2f5b3a4c1e2d3f4';
      
      const findByIdMock = listingModel.findById as jest.Mock;
      const findByIdAndUpdateMock = listingModel.findByIdAndUpdate as jest.Mock;
      
      findByIdMock.mockResolvedValueOnce({
        ...mockListing,
        sellerId: { toString: () => sellerId },
      });
      findByIdAndUpdateMock().exec.mockResolvedValueOnce({
        ...mockListing,
        title: 'Updated Title',
      });

      const result = await service.update('64b0f2f8d2f5b3a4c1e2d3f4', updateDto, sellerId);

      expect(findByIdMock).toHaveBeenCalledWith('64b0f2f8d2f5b3a4c1e2d3f4');
      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        '64b0f2f8d2f5b3a4c1e2d3f4',
        expect.objectContaining({
          title: 'Updated Title',
          lastUpdated: expect.any(Date),
        }),
        { new: true }
      );
      expect(result.title).toBe('Updated Title');
    });

    it('throws error when user is not owner', async () => {
      const updateDto = { title: 'Updated Title' };
      const sellerId = '64b0f2f8d2f5b3a4c1e2d3f4';
      const differentSellerId = '64b0f2f8d2f5b3a4c1e2d3f5';
      
      const findByIdMock = listingModel.findById as jest.Mock;
      findByIdMock.mockResolvedValueOnce({
        ...mockListing,
        sellerId: { toString: () => differentSellerId },
      });

      await expect(service.update('64b0f2f8d2f5b3a4c1e2d3f4', updateDto, sellerId))
        .rejects.toThrow('Unauthorized: You can only update your own listings');
    });

    it('throws error when listing not found', async () => {
      const findByIdMock = listingModel.findById as jest.Mock;
      findByIdMock.mockResolvedValueOnce(null);

      await expect(service.update('nonexistent', {}, 'seller'))
        .rejects.toThrow('Unauthorized: You can only update your own listings');
    });
  });

  describe('remove', () => {
    it('soft deletes listing when user is owner', async () => {
      const sellerId = '64b0f2f8d2f5b3a4c1e2d3f4';
      
      const findByIdMock = listingModel.findById as jest.Mock;
      const findByIdAndUpdateMock = listingModel.findByIdAndUpdate as jest.Mock;
      
      findByIdMock.mockResolvedValueOnce({
        ...mockListing,
        sellerId: { toString: () => sellerId },
      });
      findByIdAndUpdateMock().exec.mockResolvedValueOnce({
        ...mockListing,
        status: ListingStatus.DELETED,
        isActive: false,
        isDeleted: true,
      });

      const result = await service.remove('64b0f2f8d2f5b3a4c1e2d3f4', sellerId);

      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        '64b0f2f8d2f5b3a4c1e2d3f4',
        {
          status: ListingStatus.DELETED,
          isActive: false,
          isDeleted: true,
          lastUpdated: expect.any(Date),
        },
        { new: true }
      );
      expect(result.status).toBe(ListingStatus.DELETED);
    });

    it('throws error when user is not owner', async () => {
      const sellerId = '64b0f2f8d2f5b3a4c1e2d3f4';
      const differentSellerId = '64b0f2f8d2f5b3a4c1e2d3f5';
      
      const findByIdMock = listingModel.findById as jest.Mock;
      findByIdMock.mockResolvedValueOnce({
        ...mockListing,
        sellerId: { toString: () => differentSellerId },
      });

      await expect(service.remove('64b0f2f8d2f5b3a4c1e2d3f4', sellerId))
        .rejects.toThrow('Unauthorized: You can only delete your own listings');
    });
  });

  describe('findBySeller', () => {
    it('returns listings for specific seller', async () => {
      const findMock = listingModel.find as jest.Mock;
      findMock().sort().exec.mockResolvedValueOnce([mockListing]);

      const result = await service.findBySeller('64b0f2f8d2f5b3a4c1e2d3f4');

      expect(findMock).toHaveBeenCalledWith({
        sellerId: expect.any(Types.ObjectId),
        status: { $ne: ListingStatus.DELETED },
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ],
      });
      expect(result).toEqual([mockListing]);
    });
  });
});
