import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument, ListingStatus } from './schemas/listing.schema';
import { CreateListingDto } from '@app/common';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
  ) {}

  async create(createListingDto: CreateListingDto, sellerId: string): Promise<Listing> {
    const listing = new this.listingModel({
      ...createListingDto,
      sellerId: new Types.ObjectId(sellerId),
      status: ListingStatus.ACTIVE,
      lastUpdated: new Date(),
    });
    return listing.save();
  }

  async findAll(query: any = {}): Promise<Listing[]> {
    const {
      category,
      condition,
      minPrice,
      maxPrice,
      city,
      neighborhood,
      isFree,
      isNegotiable,
      deliveryOption,
      limit = 20,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { status: ListingStatus.ACTIVE, isActive: true };

    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (city) filter.city = city;
    if (neighborhood) filter.neighborhood = neighborhood;
    if (isFree !== undefined) filter.isFree = isFree;
    if (isNegotiable !== undefined) filter.isNegotiable = isNegotiable;
    if (deliveryOption) filter.deliveryOption = deliveryOption;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    return this.listingModel
      .find(filter)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm = 10,
    query: any = {},
  ): Promise<Listing[]> {
    const {
      category,
      condition,
      minPrice,
      maxPrice,
      isFree,
      isNegotiable,
      deliveryOption,
      limit = 20,
      page = 1,
    } = query;

    const filter: any = {
      status: ListingStatus.ACTIVE,
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
    };

    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (isFree !== undefined) filter.isFree = isFree;
    if (isNegotiable !== undefined) filter.isNegotiable = isNegotiable;
    if (deliveryOption) filter.deliveryOption = deliveryOption;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    return this.listingModel
      .find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingModel
      .findById(id)
      .exec();

    if (listing) {
      // Increment view count
      await this.listingModel.findByIdAndUpdate(id, {
        $inc: { viewCount: 1 },
      });
    }

    return listing;
  }

  async findBySeller(sellerId: string): Promise<Listing[]> {
    return this.listingModel
      .find({
        sellerId: new Types.ObjectId(sellerId),
        status: { $ne: ListingStatus.DELETED },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateListingDto: any, sellerId: string): Promise<Listing> {
    // Verify the listing belongs to the seller
    const listing = await this.listingModel.findById(id);
    if (!listing || listing.sellerId.toString() !== sellerId) {
      throw new Error('Unauthorized: You can only update your own listings');
    }

    return this.listingModel
      .findByIdAndUpdate(
        id,
        { ...updateListingDto, lastUpdated: new Date() },
        { new: true },
      )
      .exec();
  }

  async remove(id: string, sellerId: string): Promise<Listing> {
    // Verify the listing belongs to the seller
    const listing = await this.listingModel.findById(id);
    if (!listing || listing.sellerId.toString() !== sellerId) {
      throw new Error('Unauthorized: You can only delete your own listings');
    }

    return this.listingModel
      .findByIdAndUpdate(
        id,
        { status: ListingStatus.DELETED, isActive: false },
        { new: true },
      )
      .exec();
  }

  async search(searchTerm: string, query: any = {}): Promise<Listing[]> {
    const {
      category,
      condition,
      minPrice,
      maxPrice,
      city,
      neighborhood,
      limit = 20,
      page = 1,
    } = query;

    const filter: any = {
      status: ListingStatus.ACTIVE,
      isActive: true,
      $text: { $search: searchTerm },
    };

    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (city) filter.city = city;
    if (neighborhood) filter.neighborhood = neighborhood;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    return this.listingModel
      .find(filter)
      .sort({ score: { $meta: 'textScore' } })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();
  }

  async getCategories(): Promise<{ category: string; count: number }[]> {
    return this.listingModel.aggregate([
      { $match: { status: ListingStatus.ACTIVE, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
  }

  async getTrending(limit = 10): Promise<Listing[]> {
    return this.listingModel
      .find({ status: ListingStatus.ACTIVE, isActive: true })
      .sort({ viewCount: -1, favoriteCount: -1 })
      .limit(limit)
      .exec();
  }
}
