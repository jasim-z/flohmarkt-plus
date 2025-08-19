import { Injectable, ForbiddenException, NotFoundException, ServiceUnavailableException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MarketsRepository } from './markets.repository';
import { CreateMarketDto, UpdateMarketDto, UsersServiceClient, GetUsersByIdsRequest } from '@app/common';
import { MarketDocument } from './schemas/market.schema';

@Injectable()
export class MarketsService {
  constructor(
    private readonly marketsRepository: MarketsRepository,
    @InjectModel('Market') private readonly marketModel: Model<MarketDocument>,
    @Inject('USERS_SERVICE_CLIENT') private readonly usersServiceClient: UsersServiceClient,
  ) {}

  async create(createMarketDto: CreateMarketDto, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can create markets');
    }

    // Enforce 1:1 relationship between vendor limit and booths available
    if (createMarketDto.vendorLimit && createMarketDto.boothsAvailable) {
      if (createMarketDto.vendorLimit !== createMarketDto.boothsAvailable) {
        throw new ForbiddenException('Vendor limit and booths available must be equal for 1:1 allocation');
      }
    } else if (createMarketDto.vendorLimit) {
      // Auto-set booths available to match vendor limit
      createMarketDto.boothsAvailable = createMarketDto.vendorLimit;
    } else if (createMarketDto.boothsAvailable) {
      // Auto-set vendor limit to match booths available
      createMarketDto.vendorLimit = createMarketDto.boothsAvailable;
    }

    // Calculate market status based on date and time
    const marketDate = new Date(createMarketDto.date);
    const now = new Date();
    const marketStartTime = new Date(createMarketDto.date + 'T' + createMarketDto.startTime);
    const marketEndTime = new Date(createMarketDto.date + 'T' + createMarketDto.endTime);
    
    let status: string;
    if (marketDate < now && now < marketEndTime) {
      status = 'ongoing';
    } else if (marketDate > now || (marketDate.getTime() === now.getTime() && marketStartTime > now)) {
      status = 'upcoming';
    } else {
      status = 'past';
    }

    return this.marketsRepository.create({
      ...createMarketDto,
      status,
      createdBy: new Types.ObjectId(user.userId),
      registeredVendors: (createMarketDto.registeredVendors || []).map(id => new Types.ObjectId(id)),
      isDeleted: false, // Ensure new markets are not deleted
      isActive: createMarketDto.isActive !== undefined ? createMarketDto.isActive : true, // Handle legacy data
    });
  }

  async findAll(query: any = {}) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', status, category, isActive } = query;
    
    console.log('Backend received query:', query);
    
    // Build filter object with AND logic to ensure deleted markets are always filtered out
    const filter: any = {
      $and: [
        // Always filter out deleted markets (this condition must always be true)
        {
          $or: [
            { isDeleted: false },           // Explicitly not deleted
            { isDeleted: { $exists: false } } // Field doesn't exist (legacy data)
          ]
        },
        // Always show only active markets by default
        { isActive: true }
      ]
    };
    
    // Add search filter if provided
    if (search) {
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { categories: { $in: [new RegExp(search, 'i')] } },
        ]
      });
    }
    
    // Add category filter if provided
    if (category) {
      filter.$and.push({
        categories: { $in: [new RegExp(category, 'i')] }
      });
    }
    
    // Add status filter if provided
    if (status && status !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      console.log('Status filtering:', { status, now: now.toISOString(), todayStart: todayStart.toISOString(), todayEnd: todayEnd.toISOString() });
      
      if (status === 'upcoming') {
        // Markets that haven't started yet
        filter.$and.push({
          $or: [
            { date: { $gt: todayEnd } }, // Future date (after today)
            {
              $and: [
                { date: { $gte: todayStart, $lt: todayEnd } }, // Today
                { startTime: { $gt: now.toTimeString().slice(0, 5) } } // Today but hasn't started
              ]
            }
          ]
        });
      } else if (status === 'ongoing') {
        // Markets that are currently happening
        filter.$and.push({
          $and: [
            { date: { $gte: todayStart, $lt: todayEnd } }, // Today
            { startTime: { $lte: now.toTimeString().slice(0, 5) } }, // Started
            { endTime: { $gte: now.toTimeString().slice(0, 5) } } // Not ended
          ]
        });
      }
      // Note: We don't filter for 'past' status since we want to show upcoming and ongoing markets
    }
    
    // Override active filter if explicitly provided (for admin purposes)
    if (isActive !== undefined) {
      // Remove the default isActive: true filter
      filter.$and = filter.$and.filter(condition => !condition.hasOwnProperty('isActive'));
      filter.$and.push({ isActive: isActive === 'true' });
    }

    console.log('Final filter:', JSON.stringify(filter, null, 2));

    // Get total count
    const total = await this.marketModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated results
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const markets = await this.marketModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    console.log(`Found ${markets.length} markets out of ${total} total`);

    return {
      data: markets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async findByUser(userId: string) {
    return this.marketsRepository.find({
      registeredVendors: new Types.ObjectId(userId),
      isActive: true,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
  }

  async addUserToMarket(marketId: string, userId: string) {
    const market = await this.marketsRepository.findOne({ 
      _id: new Types.ObjectId(marketId),
      $or: [
        { isDeleted: false },           // Explicitly not deleted
        { isDeleted: { $exists: false } } // Field doesn't exist (legacy data)
      ]
    });
    if (!market) throw new NotFoundException('Market not found');
    
    if (!market.registeredVendors.includes(new Types.ObjectId(userId))) {
      return this.marketsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(marketId) },
        { $push: { registeredVendors: new Types.ObjectId(userId) } }
      );
    }
    
    return market;
  }

  async joinMarket(marketId: string, userId: string, paymentInfo: any) {
    // Check if market exists and is active
    const market = await this.marketsRepository.findOne({ 
      _id: new Types.ObjectId(marketId),
      isActive: true,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
    
    if (!market) {
      throw new NotFoundException('Market not found or inactive');
    }

    // Check if user is already registered
    if (market.registeredVendors.includes(new Types.ObjectId(userId))) {
      throw new ForbiddenException('User is already registered for this market');
    }

    // Check if market has available slots
    if (market.vendorLimit && market.registeredVendors.length >= market.vendorLimit) {
      throw new ForbiddenException('Market is full - no available vendor slots');
    }

    // TODO: Process payment here when payment gateway is integrated
    // For now, we'll simulate successful payment
    console.log('Payment info received:', paymentInfo);

    // Add user to market
    const updatedMarket = await this.marketsRepository.findOneAndUpdate(
      { _id: new Types.ObjectId(marketId) },
      { $push: { registeredVendors: new Types.ObjectId(userId) } }
    );

    if (!updatedMarket) {
      throw new ServiceUnavailableException('Failed to join market');
    }

    return {
      success: true,
      message: 'Successfully joined market',
      market: updatedMarket
    };
  }

  async updateRegisteredVendors(marketId: string, userIds: string[]) {
    const market = await this.marketsRepository.findOne({ 
      _id: new Types.ObjectId(marketId),
      $or: [
        { isDeleted: false },           // Explicitly not deleted
        { isDeleted: { $exists: false } } // Field doesn't exist (legacy data)
      ]
    });
    if (!market) throw new NotFoundException('Market not found');
    
    // Convert all user IDs to ObjectIds
    const objectIds = userIds.map(id => new Types.ObjectId(id));
    
    return this.marketsRepository.findOneAndUpdate(
      { _id: new Types.ObjectId(marketId) },
      { registeredVendors: objectIds }
    );
  }

  async findOne(id: string) {
    const market = await this.marketsRepository.findOne({ 
      _id: new Types.ObjectId(id),
      $or: [
        { isDeleted: false },           // Explicitly not deleted
        { isDeleted: { $exists: false } } // Field doesn't exist (legacy data)
      ]
    });
    if (!market) throw new NotFoundException('Market not found');
    return market;
  }

  async updateMarketStatuses() {
    const now = new Date();
    
    // Update ongoing markets - markets that have started but not ended
    await this.marketModel.updateMany(
      {
        status: 'upcoming',
        $and: [
          // Exclude deleted markets
          {
            $or: [
              { isDeleted: false },
              { isDeleted: { $exists: false } }
            ]
          },
          // Check date/time conditions
          {
            $or: [
              { date: { $lt: now } },
              {
                $and: [
                  { date: { $lte: now } },
                  { startTime: { $lte: now.toTimeString().slice(0, 5) } }
                ]
              }
            ]
          }
        ]
      },
      { status: 'ongoing' }
    );

    // Update past markets - markets that have ended
    await this.marketModel.updateMany(
      {
        status: { $in: ['upcoming', 'ongoing'] },
        $and: [
          // Exclude deleted markets
          {
            $or: [
              { isDeleted: false },
              { isDeleted: { $exists: false } }
            ]
          },
          // Check date/time conditions
          { date: { $lte: now } },
          { endTime: { $lte: now.toTimeString().slice(0, 5) } }
        ]
      },
      { status: 'past' }
    );

    return { message: 'Market statuses updated successfully' };
  }

  async getVendorsByMarket(marketId: string, query: any = {}) {
    const { page = 1, limit = 20, search, sortBy = 'displayName', sortOrder = 'asc' } = query;
    
    // Ensure page and limit are integers
    const pageNum = parseInt(page.toString(), 10) || 1;
    const limitNum = parseInt(limit.toString(), 10) || 20;
    
    // First, get the market to ensure it exists and get vendor IDs
    const market = await this.marketsRepository.findOne({ 
      _id: new Types.ObjectId(marketId),
      $or: [
        { isDeleted: false },           // Explicitly not deleted
        { isDeleted: { $exists: false } } // Field doesn't exist (legacy data)
      ]
    });
    if (!market) throw new NotFoundException('Market not found');
    
    if (!market.registeredVendors || market.registeredVendors.length === 0) {
      return {
        data: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    try {
      // Use HTTP service client to fetch vendor data from users service
      const request: GetUsersByIdsRequest = {
        userIds: market.registeredVendors.map(id => id.toString()),
        query: {
          page: pageNum,
          limit: limitNum,
          search,
          sortBy,
          sortOrder,
          role: 'seller',
          isActive: true,
        },
      };

      return await this.usersServiceClient.getUsersByIds(request);
    } catch (error) {
      // Handle service communication errors gracefully
      throw new ServiceUnavailableException(
        `Failed to fetch vendor data: ${error.message}. Please try again later.`
      );
    }
  }

  async getMarketDetails(marketId: string, vendorQuery: any = {}) {
    // Get market data
    const market = await this.marketsRepository.findOne({ 
      _id: new Types.ObjectId(marketId),
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
    
    if (!market) throw new NotFoundException('Market not found');

    // Get vendor data if market has vendors
    let vendors = { 
      data: [], 
      pagination: { 
        page: 1, 
        limit: 20, 
        total: 0, 
        totalPages: 0, 
        hasNext: false, 
        hasPrev: false 
      } 
    };
    
    if (market.registeredVendors && market.registeredVendors.length > 0) {
      try {
        const { page = 1, limit = 20, search, sortBy = 'displayName', sortOrder = 'asc' } = vendorQuery;
        
        const request: GetUsersByIdsRequest = {
          userIds: market.registeredVendors.map(id => id.toString()),
          query: {
            page: parseInt(page.toString(), 10) || 1,
            limit: parseInt(limit.toString(), 10) || 20,
            search,
            sortBy,
            sortOrder,
            role: 'seller',
            isActive: true,
          },
        };

        vendors = await this.usersServiceClient.getUsersByIds(request);
      } catch (error) {
        // Log error but don't fail the entire request
        console.error('Failed to fetch vendor data:', error);
        // Return empty vendors array on error
        vendors = { 
          data: [], 
          pagination: { 
            page: 1, 
            limit: 20, 
            total: 0, 
            totalPages: 0, 
            hasNext: false, 
            hasPrev: false 
          } 
        };
      }
    }

    // Calculate market statistics
    const marketStats = {
      totalVendors: market.registeredVendors?.length || 0,
      activeVendors: vendors.data.filter(v => v.isActive).length,
      verifiedVendors: vendors.data.filter(v => v.isVerified).length,
      averageRating: vendors.data.length > 0 
        ? vendors.data.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.data.length 
        : 0,
    };

    return {
      market,
      vendors: vendors.data,
      pagination: vendors.pagination,
      statistics: marketStats,
    };
  }

  async update(id: string, updateMarketDto: UpdateMarketDto, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update markets');
    }
    
    // Enforce 1:1 relationship between vendor limit and booths available
    if (updateMarketDto.vendorLimit && updateMarketDto.boothsAvailable) {
      if (updateMarketDto.vendorLimit !== updateMarketDto.boothsAvailable) {
        throw new ForbiddenException('Vendor limit and booths available must be equal for 1:1 allocation');
      }
    } else if (updateMarketDto.vendorLimit) {
      // Auto-set booths available to match vendor limit
      updateMarketDto.boothsAvailable = updateMarketDto.vendorLimit;
    } else if (updateMarketDto.boothsAvailable) {
      // Auto-set vendor limit to match booths available
      updateMarketDto.vendorLimit = updateMarketDto.boothsAvailable;
    }

    // Ensure isDeleted field exists for legacy data
    if (updateMarketDto.isDeleted === undefined) {
      updateMarketDto.isDeleted = false;
    }
    
    // Convert registeredVendors to ObjectIds if they exist
    const updateData = { ...updateMarketDto };
    if (updateData.registeredVendors && Array.isArray(updateData.registeredVendors)) {
      // The DTO expects string[], but we need to convert to ObjectId[] for MongoDB
      // We'll handle this by creating a new object with the converted values
      const convertedData = { ...updateData };
      convertedData.registeredVendors = updateData.registeredVendors.map(id => new Types.ObjectId(id)) as any;
      
      return this.marketsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        convertedData
      );
    }
    
    return this.marketsRepository.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      updateData
    );
  }

  async remove(id: string, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete markets');
    }
    
    // Use $set to ensure the isDeleted field exists
    return this.marketsRepository.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      { $set: { isDeleted: true } }
    );
  }

  async toggleActive(id: string, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can toggle market status');
    }
    
    const market = await this.marketsRepository.findOne({ _id: new Types.ObjectId(id) });
    if (!market) throw new NotFoundException('Market not found');
    
    // Handle legacy data where isActive might not exist
    const currentIsActive = market.isActive !== undefined ? market.isActive : true;
    
    return this.marketsRepository.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      { 
        $set: { 
          isActive: !currentIsActive,
          isDeleted: false // Ensure isDeleted field exists for legacy data
        }
      }
    );
  }

  async seed() {
    const existingMarkets = await this.marketsRepository.find({});
    if (existingMarkets.length > 0) {
      return { message: 'Markets already seeded', count: existingMarkets.length };
    }

    const testMarkets = [
      {
        name: 'Spring Flea Market',
        description: 'A vibrant spring market with local vendors and artisans showcasing handmade crafts, vintage items, and local produce.',
        location: 'Central Park, Downtown',
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
        createdBy: '507f1f77bcf86cd799439011', // Mock admin ID as string
        bannerImage: 'https://example.com/spring-market.jpg',
        vendorLimit: 50,
        boothsAvailable: 50,
        categories: ['Crafts', 'Vintage', 'Food', 'Art'],
        status: 'upcoming',
        registeredVendors: [],
        isDeleted: false
      },
      {
        name: 'Vintage Collectors Fair',
        description: 'Specialized market for vintage and antique items, perfect for collectors and enthusiasts.',
        location: 'Historic District',
        date: new Date('2024-02-20'),
        startTime: '10:00',
        endTime: '17:00',
        isActive: true,
        createdBy: '507f1f77bcf86cd799439011',
        bannerImage: 'https://example.com/vintage-fair.jpg',
        vendorLimit: 30,
        boothsAvailable: 30,
        categories: ['Vintage', 'Antiques', 'Collectibles'],
        status: 'past',
        registeredVendors: [],
        isDeleted: false
      },
      {
        name: 'Artisan Craft Market',
        description: 'Handmade crafts and unique artistic creations from local artisans and craftspeople.',
        location: 'Arts Quarter',
        date: new Date('2024-01-10'),
        startTime: '11:00',
        endTime: '19:00',
        isActive: true,
        createdBy: '507f1f77bcf86cd799439011',
        bannerImage: 'https://example.com/artisan-market.jpg',
        vendorLimit: 40,
        boothsAvailable: 40,
        categories: ['Crafts', 'Art', 'Handmade', 'Jewelry'],
        status: 'past',
        registeredVendors: [],
        isDeleted: false
      }
    ];

    const createdMarkets = await Promise.all(
      testMarkets.map(market => this.marketsRepository.create(market))
    );

    return { message: 'Markets seeded successfully', count: createdMarkets.length };
  }

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

  // Utility method to check if a market is deleted
  private isMarketDeleted(market: any): boolean {
    return market.isDeleted === true;
  }

  // Utility method to check if a market should be visible
  private isMarketVisible(market: any): boolean {
    return !this.isMarketDeleted(market);
  }
} 