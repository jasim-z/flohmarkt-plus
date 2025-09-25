import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { MessagesController } from './../src/messages.controller';
import { MessagesService } from './../src/messages.service';
import { MessagesGateway } from './../src/messages.gateway';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';

class AllowAllGuard {
  canActivate(context: any) {
    const req = context.switchToHttp().getRequest();
    req.user = { _id: '64b0f2f8d2f5b3a4c1e2d3f5', role: 'buyer' };
    return true;
  }
}

const mockGateway = {
  server: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
};

describe('MessagesController (integration, minimal)', () => {
  let app: INestApplication;
  let messagesService: jest.Mocked<MessagesService>;

  beforeAll(async () => {
    messagesService = {
      listMessages: jest.fn(),
      sendMessage: jest.fn(),
      markRead: jest.fn(),
      getTotalUnread: jest.fn(),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: messagesService },
        { provide: MessagesGateway, useValue: mockGateway },
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

  it('GET /conversations/:conversationId/messages returns list', async () => {
    messagesService.listMessages.mockResolvedValueOnce({ data: [{ id: 'm1', text: 'hi' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false } } as any);

    await request(app.getHttpServer())
      .get('/conversations/64b0f2f8d2f5b3a4c1e2d3f4/messages?page=1&limit=20')
      .expect(200)
      .expect(res => {
        expect(res.body.data.length).toBe(1);
      });
  });

  it('POST /conversations/:conversationId/messages sends a message', async () => {
    messagesService.sendMessage.mockResolvedValueOnce({ id: 'm1', text: 'hello', receiverId: '64b0f2f8d2f5b3a4c1e2d300' } as any);
    messagesService.getTotalUnread.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    await request(app.getHttpServer())
      .post('/conversations/64b0f2f8d2f5b3a4c1e2d3f4/messages')
      .send({ text: 'hello' })
      .expect(201)
      .expect(res => {
        expect(res.body.text).toBe('hello');
      });
  });
});
