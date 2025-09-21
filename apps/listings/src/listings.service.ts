import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Listing, ListingDocument, ListingStatus } from './schemas/listing.schema';
import { CreateListingDto } from '@app/common';
import { UpdateListingDto } from '@app/common/dto/listing/update-listing.dto';
import { QueryListingDto } from '@app/common/dto/listing/query-listing.dto';
import { SanitizationUtils } from './middleware/sanitization.middleware';

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
  ) {}

  /**
   * Helper method to create market filtering pipeline
   * Filters for active markets that are ongoing or upcoming
   */
  private createMarketFilterPipeline() {
    return [
      // Lookup market information
      {
        $lookup: {
          from: 'markets',
          localField: 'marketId',
          foreignField: '_id',
          as: 'market'
        }
      },
      
      // Unwind market array
      { $unwind: { path: '$market', preserveNullAndEmptyArrays: false } },
      
      // Filter markets based on criteria
      {
        $match: {
          'market.isActive': true,
          $and: [
            {
              $or: [
                { 'market.isDeleted': false },
                { 'market.isDeleted': { $exists: false } }
              ]
            },
            {
              $or: [
                // Ongoing markets (current date is between start and end)
                {
                  $and: [
                    { 'market.date': { $lte: new Date() } },
                    {
                      $expr: {
                        $and: [
                          { $lte: [{ $dateToString: { format: '%H:%M', date: new Date() } }, '$market.startTime'] },
                          { $gte: [{ $dateToString: { format: '%H:%M', date: new Date() } }, '$market.endTime'] }
                        ]
                      }
                    }
                  ]
                },
                // Upcoming markets (future date)
                { 'market.date': { $gt: new Date() } }
              ]
            }
          ]
        }
      }
    ];
  }

  async create(createListingDto: CreateListingDto, sellerId: string): Promise<Listing> {
    console.log('Creating listing with data:', createListingDto);
    console.log('Seller ID:', sellerId);
    
    // Sanitize input data before storing
    const sanitizedData = this.sanitizeListingData(createListingDto);
    
    const listingData: any = {
      ...sanitizedData,
      sellerId: new Types.ObjectId(sellerId),
      status: ListingStatus.ACTIVE,
      lastUpdated: new Date(),
    };

    // Convert marketId to ObjectId if provided
    if (sanitizedData.marketId) {
      console.log('Converting marketId to ObjectId:', sanitizedData.marketId);
      listingData.marketId = new Types.ObjectId(sanitizedData.marketId);
      console.log('Converted marketId:', listingData.marketId);
    }

    console.log('Final listing data:', listingData);
    const listing = new this.listingModel(listingData);
    const savedListing = await listing.save();
    console.log('Saved listing:', savedListing);
    return savedListing;
  }

  async findAll(query: QueryListingDto = {}): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
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

    const filter: any = { 
      status: ListingStatus.ACTIVE, 
      isActive: true, 
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    };

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

    // Get total count for pagination with market filtering
    const totalCountPipeline = [
      // Match listings based on basic filters
      { $match: filter },
      
      // Add market filtering
      ...this.createMarketFilterPipeline(),
      
      // Count total
      { $count: 'total' }
    ];

    const totalCountResult = await this.listingModel.aggregate(totalCountPipeline).exec();
    const total = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(total / Number(limit));
    const currentPage = Number(page);

    // Get paginated results with market filtering
    const listings = await this.listingModel
      .aggregate([
        // Match listings based on basic filters
        { $match: filter },
        
        // Add market filtering
        ...this.createMarketFilterPipeline(),
        
        // Sort results
        { $sort: sort },
        
        // Skip for pagination
        { $skip: (currentPage - 1) * Number(limit) },
        
        // Limit results
        { $limit: Number(limit) }
      ])
      .exec();

    return {
      data: listings,
      pagination: {
        page: currentPage,
        limit: Number(limit),
        total,
        totalPages
      }
    };
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
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ],
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
      .aggregate([
        // Match listings based on basic filters
        { $match: filter },
        
        // Add market filtering
        ...this.createMarketFilterPipeline(),
        
        // Limit results
        { $limit: Number(limit) },
        
        // Skip for pagination
        { $skip: (Number(page) - 1) * Number(limit) }
      ])
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
        $or: [
          { isDeleted: false },
          { isDeleted: { $exists: false } }
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findBySellerAndMarket(
    sellerId: string, 
    marketId: string, 
    page: number = 1, 
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    console.log('Finding listings for seller:', sellerId, 'and market:', marketId);
    
    const query: any = {
      sellerId: new Types.ObjectId(sellerId),
      marketId: new Types.ObjectId(marketId),
      status: { $ne: ListingStatus.DELETED },
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ],
    };

    // Add search functionality
    if (search && search.trim()) {
      // Create a separate $or for search conditions
      const searchConditions = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
      
      // Use $and to combine deletion filter with search conditions
      query.$and = [
        {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        },
        {
          $or: searchConditions
        }
      ];
      
      // Remove the original $or since we're using $and now
      delete query.$or;
    }
    
    console.log('Final Query:', JSON.stringify(query, null, 2));
    console.log('Search term used:', search);
    console.log('Query type:', typeof query);
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await this.listingModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const listings = await this.listingModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    
    console.log('Found listings:', listings.length);
    console.log('Listings:', listings);
    
    return {
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async findByMarket(
    marketId: string, 
    page: number = 1, 
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Listing[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    console.log('Finding listings for market:', marketId);
    
    const query: any = {
      marketId: new Types.ObjectId(marketId),
      status: { $ne: ListingStatus.DELETED },
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ],
    };

    // Add search functionality
    if (search && search.trim()) {
      // Create a separate $or for search conditions
      const searchConditions = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
      
      // Use $and to combine deletion filter with search conditions
      query.$and = [
        {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        },
        {
          $or: searchConditions
        }
      ];
      
      // Remove the original $or since we're using $and now
      delete query.$or;
    }
    
    console.log('Final Query:', JSON.stringify(query, null, 2));
    console.log('Search term used:', search);
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await this.listingModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const listings = await this.listingModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    
    console.log('Found listings:', listings.length);
    
    return {
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async update(id: string, updateListingDto: UpdateListingDto, sellerId: string): Promise<Listing> {
    // Verify the listing belongs to the seller
    const listing = await this.listingModel.findById(id);
    if (!listing || listing.sellerId.toString() !== sellerId) {
      throw new Error('Unauthorized: You can only update your own listings');
    }

    // Sanitize input data before updating
    const sanitizedData = this.sanitizeListingData(updateListingDto);

    return this.listingModel
      .findByIdAndUpdate(
        id,
        { ...sanitizedData, lastUpdated: new Date() },
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
        { 
          status: ListingStatus.DELETED, 
          isActive: false, 
          isDeleted: true,
          lastUpdated: new Date()
        },
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
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ],
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
      .aggregate([
        // Match listings based on basic filters
        { $match: filter },
        
        // Add market filtering
        ...this.createMarketFilterPipeline(),
        
        // Sort by text score
        { $sort: { score: { $meta: 'textScore' } } },
        
        // Limit results
        { $limit: Number(limit) },
        
        // Skip for pagination
        { $skip: (Number(page) - 1) * Number(limit) }
      ])
      .exec();
  }

  async getCategories(): Promise<{ category: string; count: number }[]> {
    return this.listingModel.aggregate([
      // Match active listings
      { 
        $match: { 
          status: ListingStatus.ACTIVE, 
          isActive: true, 
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        } 
      },
      
      // Add market filtering
      ...this.createMarketFilterPipeline(),
      
      // Group by category and count
      { $group: { _id: '$category', count: { $sum: 1 } } },
      
      // Project to desired format
      { $project: { category: '$_id', count: 1, _id: 0 } },
      
      // Sort by count
      { $sort: { count: -1 } }
    ]);
  }

  async getTrending(limit = 10): Promise<Listing[]> {
    return this.listingModel
      .aggregate([
        // Match active listings
        { 
          $match: { 
            status: ListingStatus.ACTIVE, 
            isActive: true, 
            $or: [
              { isDeleted: false },
              { isDeleted: { $exists: false } }
            ]
          } 
        },
        
        // Add market filtering
        ...this.createMarketFilterPipeline(),
        
        // Sort by view count and favorite count
        { $sort: { viewCount: -1, favoriteCount: -1 } },
        
        // Limit results
        { $limit: limit }
      ])
      .exec();
  }

  // Debug method to check all listings
  async debugAllListings(): Promise<any[]> {
    return this.listingModel.find({}).lean().exec();
  }

  /**
   * Sanitize listing data before storing in database
   */
  private sanitizeListingData(data: CreateListingDto | UpdateListingDto): any {
    const sanitized: any = { ...data };

    // Sanitize string fields
    if (sanitized.title) {
      sanitized.title = SanitizationUtils.sanitizeText(sanitized.title);
    }
    if (sanitized.description) {
      sanitized.description = SanitizationUtils.sanitizeText(sanitized.description);
    }
    if (sanitized.city) {
      sanitized.city = SanitizationUtils.sanitizeText(sanitized.city);
    }
    if (sanitized.neighborhood) {
      sanitized.neighborhood = SanitizationUtils.sanitizeText(sanitized.neighborhood);
    }
    if (sanitized.brand) {
      sanitized.brand = SanitizationUtils.sanitizeText(sanitized.brand);
    }
    if (sanitized.model) {
      sanitized.model = SanitizationUtils.sanitizeText(sanitized.model);
    }
    if (sanitized.dimensions) {
      sanitized.dimensions = SanitizationUtils.sanitizeText(sanitized.dimensions);
    }
    if (sanitized.weight) {
      sanitized.weight = SanitizationUtils.sanitizeText(sanitized.weight);
    }
    if (sanitized.pickupAddress) {
      sanitized.pickupAddress = SanitizationUtils.sanitizeText(sanitized.pickupAddress);
    }
    if (sanitized.pickupInstructions) {
      sanitized.pickupInstructions = SanitizationUtils.sanitizeText(sanitized.pickupInstructions);
    }

    // Sanitize image URLs
    if (sanitized.images && Array.isArray(sanitized.images)) {
      sanitized.images = sanitized.images
        .map(url => SanitizationUtils.sanitizeUrl(url))
        .filter(url => url.length > 0);
    }

    // Sanitize tags
    if (sanitized.tags && Array.isArray(sanitized.tags)) {
      sanitized.tags = sanitized.tags
        .map(tag => SanitizationUtils.sanitizeText(tag))
        .filter(tag => tag.length > 0);
    }

    return sanitized;
  }
}
