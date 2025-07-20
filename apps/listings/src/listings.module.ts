import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { SeedService } from './seeds/seed.service';
import { SeedController } from './seeds/seed.controller';
import { Listing, ListingSchema } from './schemas/listing.schema';
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
      envFilePath: './apps/listings/.env',
    }),
    DatabaseModule,
    PassportModule,
    MongooseModule.forFeature([{ name: Listing.name, schema: ListingSchema }]),
  ],
  controllers: [ListingsController, SeedController],
  providers: [ListingsService, SeedService, JwtStrategy, RolesGuard],
  exports: [ListingsService],
})
export class ListingsModule {}
