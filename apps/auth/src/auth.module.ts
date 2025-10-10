import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RmqModule, DatabaseModule, HealthController, MetricsService, MetricsMiddleware, CorrelationMiddleware, S3ClientService, LocationService } from '@app/common';
import * as Joi from 'joi';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy, LocalStrategy } from '@app/common';
import { UsersModule } from 'apps/auth/src/users/users.module';
import { loadConfig } from '@app/common/config/config';
import { UsersService } from 'apps/auth/src/users/users.service';
import { SeedService } from './seeds/seed.service';
import { SeedController } from './seeds/seed.controller';
import { SanitizationMiddleware } from './middleware/sanitization.middleware';
import { RateLimitMiddleware, RATE_LIMITS } from './middleware/rate-limit.middleware';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    RmqModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        MONGODB_URI: Joi.string().required(),
        RABBIT_MQ_URI: Joi.string().required(),
        RABBIT_MQ_AUTH_QUEUE: Joi.string().required(),
        // S3 Configuration (optional for auth service)
        S3_ENDPOINT: Joi.string().allow('').optional(),
        S3_EXTERNAL_ENDPOINT: Joi.string().allow('').optional(),
        S3_FORCE_PATH_STYLE: Joi.string().default('true'),
        AWS_REGION: Joi.string().default('us-east-1'),
        AWS_ACCESS_KEY_ID: Joi.string().optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
        S3_BUCKET_NAME: Joi.string().optional(),
        // Email Configuration (optional)
        SMTP_HOST: Joi.string().optional(),
        SMTP_PORT: Joi.number().default(587),
        SMTP_USER: Joi.string().optional(),
        SMTP_PASS: Joi.string().optional(),
        SMTP_FROM: Joi.string().optional(),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
      }),
      load: [loadConfig],
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION')}s`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, SeedController, HealthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    SeedService,
    MetricsService,
    S3ClientService,
    LocationService,
    {
      provide: 'IUserService',
      useExisting: UsersService,
    },
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Correlation and metrics on all routes
    consumer
      .apply(CorrelationMiddleware, MetricsMiddleware)
      .forRoutes('*');

    consumer.apply(SanitizationMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.GENERAL)).forRoutes('*');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.LOGIN)).forRoutes('POST /auth/login');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.USERS_CREATE)).forRoutes('POST /users');
  }
}
