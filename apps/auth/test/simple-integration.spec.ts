import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthService } from './../src/auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../src/users/schemas/user.schema';
import { UserRole } from '@app/common';
import { Types } from 'mongoose';

describe('AuthService Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;

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
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const config = {
                JWT_SECRET: 'test-secret-key',
                JWT_EXPIRATION: '3600',
              };
              return config[key];
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    authService = app.get<AuthService>(AuthService);
  });

  describe('AuthService Integration', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
    });

    it('should handle login with valid user', async () => {
      const mockResponse = {
        cookie: jest.fn(),
      };

      const result = await authService.login(mockUser, mockResponse);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(mockResponse.cookie).toHaveBeenCalled();
    });

    it('should handle logout', () => {
      const mockResponse = {
        cookie: jest.fn(),
      };

      authService.logout(mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'authentication',
        '',
        expect.objectContaining({
          httpOnly: true,
          expires: expect.any(Date),
        })
      );
    });

    it('should validate input data', async () => {
      const mockResponse = {
        cookie: jest.fn(),
      };

      await expect(authService.login(null, mockResponse))
        .rejects
        .toThrow('User data is required');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
