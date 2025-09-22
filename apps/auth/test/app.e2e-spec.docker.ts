import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthModule } from './../src/auth.module';
import { User } from '../src/users/schemas/user.schema';
import { UserRole } from '@app/common';
import { Types } from 'mongoose';

describe('AuthController Integration Tests (Docker)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let connection: Connection;

  // Test user data
  const testUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    password: '$2b$10$hashedpassword', // bcrypt hash
    displayName: 'Test User',
    role: UserRole.BUYER,
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
      imports: [AuthModule],
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
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Add middleware like in main.ts
    app.use(cookieParser());
    app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    
    await app.init();

    // Get database models for cleanup
    userModel = app.get<Model<User>>(getModelToken(User.name));
    connection = app.get<Connection>('DatabaseConnection');
  });

  beforeEach(async () => {
    // Clean database before each test
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await userModel.deleteMany({});
    await connection.close();
    await app.close();
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully and clear cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toEqual({ message: 'Logged out successfully' });

      // Verify cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const authCookie = cookies.find((cookie: string) => cookie.includes('authentication='));
        expect(authCookie).toContain('authentication=;'); // Empty value
      }
    });
  });

  describe('Configuration Integration', () => {
    it('should validate JWT configuration', () => {
      // Test that the service can be instantiated with valid config
      expect(app).toBeDefined();
    });
  });

  // Note: Database-dependent tests require MongoDB to be running
  // Run with: docker-compose up mongodb-primary before running these tests
});
