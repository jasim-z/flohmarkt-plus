import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { Market, MarketSchema } from './schemas/market.schema';
import { MarketsRepository } from './markets.repository';
import { DatabaseModule, JwtStrategy, RolesGuard } from '@app/common';
import { PassportModule } from '@nestjs/passport';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.number().required(),
      }),
      envFilePath: './apps/markets/.env',
    }),
    DatabaseModule,
    PassportModule,
    MongooseModule.forFeature([{ name: Market.name, schema: MarketSchema }]),
  ],
  controllers: [MarketsController],
  providers: [MarketsService, MarketsRepository, JwtStrategy, RolesGuard],
  exports: [MarketsService],
})
export class MarketsModule {} 