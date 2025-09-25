import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { Market, MarketSchema } from './schemas/market.schema';
import { MarketsRepository } from './markets.repository';
import { MarketPriceMigrationService } from './migration/add-price-field';
import { DatabaseModule, JwtStrategy, RolesGuard, HttpUsersServiceClient, CorrelationMiddleware, MetricsService, MetricsMiddleware, HealthController } from '@app/common';
import { PassportModule } from '@nestjs/passport';
import { RateLimitMiddleware, RATE_LIMITS } from './middleware/rate-limit.middleware';
import { SanitizationMiddleware } from './middleware/sanitization.middleware';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.number().required(),
        USERS_SERVICE_URL: Joi.string().optional().default('http://localhost:3950'),
      }),
    }),
    DatabaseModule,
    PassportModule,
    HttpModule,
    MongooseModule.forFeature([{ name: Market.name, schema: MarketSchema }]),
  ],
  controllers: [MarketsController, HealthController],
  providers: [
    MarketsService, 
    MarketsRepository, 
    JwtStrategy, 
    RolesGuard,
    HttpUsersServiceClient,
    MarketPriceMigrationService,
    MetricsService,
    {
      provide: 'USERS_SERVICE_CLIENT',
      useClass: HttpUsersServiceClient,
    },
  ],
  exports: [MarketsService],
})
export class MarketsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Correlation and metrics on all routes
    consumer
      .apply(CorrelationMiddleware, MetricsMiddleware)
      .forRoutes('*');

    // Apply sanitization middleware to all routes
    consumer
      .apply(SanitizationMiddleware)
      .forRoutes('*');

    // Apply rate limiting to specific routes
    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.CREATE))
      .forRoutes('POST /markets');

    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.BULK))
      .forRoutes('POST /markets/bulk');

    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.JOIN))
      .forRoutes('POST /markets/*/join');

    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.SEARCH))
      .forRoutes('GET /markets');

    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.GENERAL))
      .forRoutes('*');
  }
} 