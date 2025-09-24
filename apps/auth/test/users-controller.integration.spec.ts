import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { UsersController } from './../src/users/users.controller';
import { UsersService } from './../src/users/users.service';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import { RolesGuard } from '@app/common/guards/roles.guard';

class AllowAllGuard {
  canActivate() { return true; }
}

describe('UsersController (integration, minimal)', () => {
  let app: INestApplication;
  let usersService: jest.Mocked<UsersService>;

  beforeAll(async () => {
    usersService = {
      createUser: jest.fn(),
      getUsers: jest.fn(),
      getUserById: jest.fn(),
      getPublicUserInfo: jest.fn(),
      getUsersByIds: jest.fn(),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
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

  describe('POST /users', () => {
    it('201 on valid body', async () => {
      usersService.createUser.mockResolvedValueOnce({ _id: 'u1', email: 'a@b.com' } as any);

      await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'a@b.com', password: 'secret', displayName: 'Alice' })
        .expect(201)
        .expect(res => {
          expect(res.body).toEqual(expect.objectContaining({ _id: 'u1', email: 'a@b.com' }));
        });
    });

    it('422 on duplicate email', async () => {
      usersService.createUser.mockRejectedValueOnce(new UnprocessableEntityException('Email already exists.'));

      await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'a@b.com', password: 'secret', displayName: 'Alice' })
        .expect(422)
        .expect(res => {
          expect(res.body.message).toBe('Email already exists.');
        });
    });
  });

  describe('GET /users/:id', () => {
    it('400 on invalid id', async () => {
      await request(app.getHttpServer())
        .get('/users/not-an-objectid')
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Invalid user id');
        });
    });

    it('200 on valid id and user exists', async () => {
      usersService.getUserById.mockResolvedValueOnce({ _id: '64b0f2f8d2f5b3a4c1e2d3f4' } as any);

      await request(app.getHttpServer())
        .get('/users/64b0f2f8d2f5b3a4c1e2d3f4')
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual(expect.objectContaining({ _id: '64b0f2f8d2f5b3a4c1e2d3f4' }));
        });
    });

    it('422 when not found', async () => {
      usersService.getUserById.mockRejectedValueOnce(new UnprocessableEntityException('User not found'));

      await request(app.getHttpServer())
        .get('/users/64b0f2f8d2f5b3a4c1e2d3f4')
        .expect(422)
        .expect(res => {
          expect(res.body.message).toBe('User not found');
        });
    });
  });

  describe('GET /users', () => {
    it('200 returns paginated result (requires admin)', async () => {
      usersService.getUsers.mockResolvedValueOnce({
        data: [{ _id: 'u1', email: 'a@b.com', displayName: 'Alice' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      } as any);

      await request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .expect(200)
        .expect(res => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.pagination).toEqual(expect.objectContaining({ page: 1, limit: 10 }));
        });
    });
  });
});
