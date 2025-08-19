import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing, ListingDocument } from '../schemas/listing.schema';

@Injectable()
export class ListingMarketIdMigrationService {
  constructor(
    @InjectModel(Listing.name) private readonly listingModel: Model<ListingDocument>,
  ) {}

  async addMarketIdFieldToExistingListings() {
    try {
      console.log('Starting migration: Adding marketId field to existing listings...');
      
      // Find all listings that don't have the marketId field
      const listingsWithoutMarketId = await this.listingModel.find({
        marketId: { $exists: false }
      });
      
      console.log(`Found ${listingsWithoutMarketId.length} listings without marketId field`);
      
      if (listingsWithoutMarketId.length === 0) {
        console.log('No migration needed - all listings already have marketId field');
        return { message: 'No migration needed', count: 0 };
      }
      
      // Update all listings to add marketId: null (indicating no specific market)
      const result = await this.listingModel.updateMany(
        { marketId: { $exists: false } },
        { $set: { marketId: null } }
      );
      
      console.log(`Migration completed: ${result.modifiedCount} listings updated`);
      
      return {
        message: 'Migration completed successfully',
        count: result.modifiedCount,
        totalListings: listingsWithoutMarketId.length
      };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
} 