import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { Market, MarketSchema } from './schemas/market.schema';
import { MarketsRepository } from './markets.repository';
import { MarketPriceMigrationService } from './migration/add-price-field';
import { DatabaseModule, JwtStrategy, RolesGuard, HttpUsersServiceClient } from '@app/common';
import { PassportModule } from '@nestjs/passport';
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
  controllers: [MarketsController],
  providers: [
    MarketsService, 
    MarketsRepository, 
    JwtStrategy, 
    RolesGuard,
    HttpUsersServiceClient,
    MarketPriceMigrationService,
    {
      provide: 'USERS_SERVICE_CLIENT',
      useClass: HttpUsersServiceClient,
    },
  ],
  exports: [MarketsService],
})
export class MarketsModule {} 