import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { ListingsController } from './../src/listings.controller';
import { ListingsService } from './../src/listings.service';
import { ListingMarketIdMigrationService } from './../src/migration/add-market-id-field';
import { ListingIsDeletedMigrationService } from './../src/migration/add-is-deleted-field';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';

class AllowAllGuard {
  canActivate(context: any) { 
    // Set the user in the request object
    context.switchToHttp().getRequest().user = mockRequest.user;
    return true; 
  }
}

// Mock request object with user
const mockRequest = {
  user: {
    userId: '64b0f2f8d2f5b3a4c1e2d3f5',
    email: 'test@example.com',
    role: 'seller'
  }
};

describe('ListingsController (integration, minimal)', () => {
  let app: INestApplication;
  let listingsService: jest.Mocked<ListingsService>;

  beforeAll(async () => {
    listingsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findBySeller: jest.fn(),
      findByMarket: jest.fn(),
      findBySellerAndMarket: jest.fn(),
      findNearby: jest.fn(),
      search: jest.fn(),
      getCategories: jest.fn(),
      getTrending: jest.fn(),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [
        { provide: ListingsService, useValue: listingsService },
        { provide: ListingMarketIdMigrationService, useValue: {} },
        { provide: ListingIsDeletedMigrationService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(AllowAllGuard)
      .overrideGuard(RolesGuard)
      .useClass(AllowAllGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /listings', () => {
    it('201 on valid listing creation', async () => {
      const mockListing = {
        _id: '64b0f2f8d2f5b3a4c1e2d3f4',
        title: 'Test Item',
        price: 100,
        category: 'electronics',
        sellerId: '64b0f2f8d2f5b3a4c1e2d3f5',
      };
      listingsService.create.mockResolvedValueOnce(mockListing as any);

      await request(app.getHttpServer())
        .post('/listings')
        .send({
          title: 'Test Item',
          description: 'Test description',
          price: 100,
          category: 'electronics',
          condition: 'good',
          isFree: false,
          city: 'Berlin',
          neighborhood: 'Mitte',
          latitude: 52.5200,
          longitude: 13.4050,
          deliveryOption: 'pickup_only',
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toEqual(expect.objectContaining({
            _id: '64b0f2f8d2f5b3a4c1e2d3f4',
            title: 'Test Item',
            price: 100,
          }));
        });
    });
  });

  describe('GET /listings', () => {
    it('200 returns paginated listings', async () => {
      const mockResponse = {
        data: [{ _id: 'l1', title: 'Item 1' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      listingsService.findAll.mockResolvedValueOnce(mockResponse as any);

      await request(app.getHttpServer())
        .get('/listings?page=1&limit=20')
        .expect(200)
        .expect(res => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.pagination).toEqual(expect.objectContaining({
            page: 1,
            limit: 20,
          }));
        });
    });
  });

  describe('GET /listings/:id', () => {
    it('200 returns single listing', async () => {
      const mockListing = {
        _id: '64b0f2f8d2f5b3a4c1e2d3f4',
        title: 'Test Item',
        price: 100,
      };
      listingsService.findOne.mockResolvedValueOnce(mockListing as any);

      await request(app.getHttpServer())
        .get('/listings/64b0f2f8d2f5b3a4c1e2d3f4')
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual(expect.objectContaining({
            _id: '64b0f2f8d2f5b3a4c1e2d3f4',
            title: 'Test Item',
          }));
        });
    });
  });
});
