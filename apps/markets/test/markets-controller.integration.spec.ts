import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { MarketsController } from './../src/markets.controller';
import { MarketsService } from './../src/markets.service';
import { MarketPriceMigrationService } from './../src/migration/add-price-field';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';

class AllowAllGuard {
  canActivate(context: any) {
    const req = context.switchToHttp().getRequest();
    const isJoin = typeof req.url === 'string' && req.url.includes('/join');
    req.user = req.user || { userId: '64b0f2f8d2f5b3a4c1e2d3f5', role: isJoin ? 'seller' : 'admin' };
    return true;
  }
}

describe('MarketsController (integration, minimal)', () => {
  let app: INestApplication;
  let marketsService: jest.Mocked<MarketsService>;

  beforeAll(async () => {
    marketsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      joinMarket: jest.fn(),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MarketsController],
      providers: [
        { provide: MarketsService, useValue: marketsService },
        { provide: MarketPriceMigrationService, useValue: {} },
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

  it('GET /markets returns paginated list', async () => {
    marketsService.findAll.mockResolvedValueOnce({
      data: [{ id: 'm1', name: 'Market 1' }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    } as any);

    await request(app.getHttpServer())
      .get('/markets?page=1&limit=10')
      .expect(200)
      .expect(res => {
        expect(res.body.data.length).toBe(1);
        expect(res.body.pagination.page).toBe(1);
      });
  });

  it('POST /markets creates market (admin)', async () => {
    marketsService.create.mockResolvedValueOnce({ id: 'm1', name: 'New Market' } as any);

    await request(app.getHttpServer())
      .post('/markets')
      .send({
        name: 'New Market',
        description: 'A wonderful community market with many stalls and activities.',
        location: 'Central City Square, Downtown',
        date: '2099-12-31',
        startTime: '09:00',
        endTime: '18:00',
        categories: ['Crafts'],
        bannerImage: 'https://example.com/banner.jpg',
        price: 0,
      })
      .expect(res => { if (res.status !== 201) console.log('Create validation:', res.body); })
      .expect(201)
      .expect(res => {
        expect(res.body).toEqual(expect.objectContaining({ name: 'New Market' }));
      });
  });

  it('POST /markets/:marketId/join registers seller', async () => {
    marketsService.joinMarket.mockResolvedValueOnce({ success: true } as any);

    await request(app.getHttpServer())
      .post('/markets/64b0f2f8d2f5b3a4c1e2d3f4/join')
      .send({ paymentMethod: 'cash' })
      .expect(res => { if (res.status !== 201) console.log('Join validation:', res.body); })
      .expect(201)
      .expect(res => {
        expect(res.body.success).toBe(true);
      });
  });
});
