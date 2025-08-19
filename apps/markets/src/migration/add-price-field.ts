import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MarketDocument } from '../schemas/market.schema';

@Injectable()
export class MarketPriceMigrationService {
  constructor(
    @InjectModel('Market') private readonly marketModel: Model<MarketDocument>,
  ) {}

  async addPriceFieldToExistingMarkets() {
    try {
      console.log('Starting migration: Adding price field to existing markets...');
      
      // Find all markets that don't have the price field
      const marketsWithoutPrice = await this.marketModel.find({
        price: { $exists: false }
      });
      
      console.log(`Found ${marketsWithoutPrice.length} markets without price field`);
      
      if (marketsWithoutPrice.length === 0) {
        console.log('No migration needed - all markets already have price field');
        return { message: 'No migration needed', count: 0 };
      }
      
      // Update all markets to add price: 0 (default value)
      const result = await this.marketModel.updateMany(
        { price: { $exists: false } },
        { $set: { price: Types.Decimal128.fromString('0') } }
      );
      
      console.log(`Migration completed: ${result.modifiedCount} markets updated`);
      
      return {
        message: 'Migration completed successfully',
        count: result.modifiedCount,
        totalMarkets: marketsWithoutPrice.length
      };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async updatePriceFieldToDecimal128() {
    try {
      console.log('Starting migration: Converting price field to Decimal128...');
      
      // Find all markets with price field that might not be Decimal128
      const marketsWithPrice = await this.marketModel.find({
        price: { $exists: true }
      });
      
      console.log(`Found ${marketsWithPrice.length} markets with price field`);
      
      let updatedCount = 0;
      
      for (const market of marketsWithPrice) {
        // Check if price is not already Decimal128
        if (market.price && typeof market.price !== 'object') {
          // Convert to Decimal128
          await this.marketModel.updateOne(
            { _id: market._id },
            { $set: { price: Types.Decimal128.fromString(market.price.toString()) } }
          );
          updatedCount++;
        }
      }
      
      console.log(`Migration completed: ${updatedCount} markets updated to Decimal128`);
      
      return {
        message: 'Migration completed successfully',
        count: updatedCount,
        totalMarkets: marketsWithPrice.length
      };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
} 