import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthController } from './../src/auth.controller';
import { AuthService } from './../src/auth.service';
import { UsersService } from './../src/users/users.service';
import { User } from '../src/users/schemas/user.schema';
import { UserRole } from '@app/common';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

describe('AuthController Integration Tests', () => {
  let app: INestApplication;
  let authController: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockUser: User = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    displayName: 'Test User',
    role: UserRole.BUYER,
    password: 'hashedPassword',
    isActive: true,
    isVerified: false,
    rating: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalReviews: 0,
    badges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          const config = {
            JWT_SECRET: 'test-secret-key-for-integration-tests',
            JWT_EXPIRATION: '3600',
            MONGODB_URI: 'mongodb://localhost:27017/auth-integration-test',
            RABBIT_MQ_URI: 'amqp://localhost:5672',
            RABBIT_MQ_AUTH_QUEUE: 'auth_queue',
            PORT: '3001',
          };
          return config[key];
        },
      })
      .overrideProvider(getModelToken(User.name))
      .useValue({
        create: jest.fn().mockResolvedValue(mockUser),
        findOne: jest.fn().mockResolvedValue(mockUser),
        findById: jest.fn().mockResolvedValue(mockUser),
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      })
      .overrideProvider(UsersService)
      .useValue({
        getUser: jest.fn().mockResolvedValue(mockUser),
        createUser: jest.fn().mockResolvedValue(mockUser),
        validateUser: jest.fn().mockResolvedValue(mockUser),
      })
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
        verify: jest.fn().mockReturnValue({
          userId: mockUser._id.toString(),
          email: mockUser.email,
          role: mockUser.role,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    
    await app.init();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
    usersService = app.get<UsersService>(UsersService);
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully and clear cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ message: 'Logged out successfully' });

      // Verify cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        const authCookie = cookies.find((cookie: string) => cookie.includes('authentication='));
        expect(authCookie).toContain('authentication=;'); // Empty value
      }
    });
  });

  describe('GET /auth/me', () => {
    it('should return user data with valid JWT token', async () => {
      // Mock the JWT guard to pass
      const mockRequest = {
        user: {
          userId: mockUser._id.toString(),
          email: mockUser.email,
          role: mockUser.role,
        },
      };

      // We need to mock the guard behavior
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Microservice Integration', () => {
    it('should handle get_user message pattern', async () => {
      const result = await authController.getUser({ userId: mockUser._id.toString() });

      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('role', 'buyer');
      expect(result).not.toHaveProperty('password'); // Should not include sensitive data
    });

    it('should return null for non-existent user', async () => {
      // Mock usersService to return null
      jest.spyOn(usersService, 'getUser').mockResolvedValueOnce(null);

      const result = await authController.getUser({ userId: new Types.ObjectId().toString() });

      expect(result).toBeNull();
    });
  });

  describe('Configuration Integration', () => {
    it('should use correct JWT configuration', () => {
      const configService = app.get(ConfigService);
      expect(configService.get('JWT_SECRET')).toBe('test-secret-key-for-integration-tests');
      expect(configService.get('JWT_EXPIRATION')).toBe('3600');
    });
  });

  describe('Service Integration', () => {
    it('should have all services properly injected', () => {
      expect(authController).toBeDefined();
      expect(authService).toBeDefined();
      expect(usersService).toBeDefined();
    });

    it('should handle service method calls', async () => {
      const mockResponse = {
        cookie: jest.fn(),
      };

      const result = await authService.login(mockUser, mockResponse);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
