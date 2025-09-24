import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RmqModule, DatabaseModule, HealthController, MetricsService, MetricsMiddleware, CorrelationMiddleware } from '@app/common';
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
