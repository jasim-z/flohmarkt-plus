import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { SeedService } from './seeds/seed.service';
import { SeedController } from './seeds/seed.controller';
import { Listing, ListingSchema } from './schemas/listing.schema';
import { ListingMarketIdMigrationService } from './migration/add-market-id-field';
import { ListingIsDeletedMigrationService } from './migration/add-is-deleted-field';
import { DatabaseModule, JwtStrategy, RolesGuard } from '@app/common';
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
      }),
      envFilePath: './apps/listings/.env',
    }),
    DatabaseModule,
    PassportModule,
    MongooseModule.forFeature([{ name: Listing.name, schema: ListingSchema }]),
  ],
  controllers: [ListingsController, SeedController],
  providers: [ListingsService, SeedService, JwtStrategy, RolesGuard, ListingMarketIdMigrationService, ListingIsDeletedMigrationService, SanitizationMiddleware],
  exports: [ListingsService],
})
export class ListingsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply sanitization middleware to all routes
    consumer
      .apply(SanitizationMiddleware)
      .forRoutes('*');

    // Apply general rate limiting to all listing routes
    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.GENERAL))
      .forRoutes('listings');

    // Apply stricter rate limiting to creation endpoints
    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.CREATE))
      .forRoutes('listings', 'listings/market/*');

    // Apply strict rate limiting to search endpoints
    consumer
      .apply(RateLimitMiddleware.create(RATE_LIMITS.SEARCH))
      .forRoutes('listings/search', 'listings/nearby');
  }
}
