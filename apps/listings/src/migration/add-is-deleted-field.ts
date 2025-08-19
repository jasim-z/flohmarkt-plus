import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing, ListingDocument } from '../schemas/listing.schema';

@Injectable()
export class ListingIsDeletedMigrationService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
  ) {}

  async addIsDeletedFieldToExistingListings(): Promise<void> {
    console.log('Starting migration: Adding isDeleted field to existing listings...');
    
    try {
      // Update all existing listings to have isDeleted: false
      const result = await this.listingModel.updateMany(
        { isDeleted: { $exists: false } },
        { $set: { isDeleted: false } }
      );
      
      console.log(`Migration completed successfully. Updated ${result.modifiedCount} listings.`);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async updateDeletedListings(): Promise<void> {
    console.log('Starting migration: Updating deleted listings to use isDeleted field...');
    
    try {
      // Update listings with status 'deleted' to have isDeleted: true
      const result = await this.listingModel.updateMany(
        { status: 'deleted', isDeleted: { $ne: true } },
        { $set: { isDeleted: true } }
      );
      
      console.log(`Migration completed successfully. Updated ${result.modifiedCount} deleted listings.`);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async checkMigrationStatus(): Promise<{ needsMigration: boolean; totalListings: number; listingsWithField: number; listingsWithoutField: number }> {
    try {
      const totalListings = await this.listingModel.countDocuments({});
      const listingsWithField = await this.listingModel.countDocuments({ isDeleted: { $exists: true } });
      const listingsWithoutField = totalListings - listingsWithField;
      
      return {
        needsMigration: listingsWithoutField > 0,
        totalListings,
        listingsWithField,
        listingsWithoutField
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      throw error;
    }
  }
} 