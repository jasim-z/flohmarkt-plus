import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketDocument } from '../schemas/market.schema';

@Injectable()
export class MarketMigrationService {
  constructor(
    @InjectModel('Market') private readonly marketModel: Model<MarketDocument>,
  ) {}

  async addIsDeletedFieldToExistingMarkets() {
    try {
      console.log('Starting migration: Adding isDeleted field to existing markets...');
      
      // Find all markets that don't have the isDeleted field
      const marketsWithoutIsDeleted = await this.marketModel.find({
        isDeleted: { $exists: false }
      });
      
      console.log(`Found ${marketsWithoutIsDeleted.length} markets without isDeleted field`);
      
      if (marketsWithoutIsDeleted.length === 0) {
        console.log('No migration needed - all markets already have isDeleted field');
        return { message: 'No migration needed', count: 0 };
      }
      
      // Update all markets to add isDeleted: false
      const result = await this.marketModel.updateMany(
        { isDeleted: { $exists: false } },
        { $set: { isDeleted: false } }
      );
      
      console.log(`Migration completed: ${result.modifiedCount} markets updated`);
      
      return {
        message: 'Migration completed successfully',
        count: result.modifiedCount,
        totalMarkets: marketsWithoutIsDeleted.length
      };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async addIsActiveFieldToExistingMarkets() {
    try {
      console.log('Starting migration: Adding isActive field to existing markets...');
      
      // Find all markets that don't have the isActive field
      const marketsWithoutIsActive = await this.marketModel.find({
        isActive: { $exists: false }
      });
      
      console.log(`Found ${marketsWithoutIsActive.length} markets without isActive field`);
      
      if (marketsWithoutIsActive.length === 0) {
        console.log('No migration needed - all markets already have isActive field');
        return { message: 'No migration needed', count: 0 };
      }
      
      // Update all markets to add isActive: true
      const result = await this.marketModel.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true } }
      );
      
      console.log(`Migration completed: ${result.modifiedCount} markets updated`);
      
      return {
        message: 'Migration completed successfully',
        count: result.modifiedCount,
        totalMarkets: marketsWithoutIsActive.length
      };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
} 