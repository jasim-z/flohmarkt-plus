import { Injectable, ForbiddenException, NotFoundException, ServiceUnavailableException, Inject } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { MarketsRepository } from './markets.repository';
import { CreateMarketDto, UpdateMarketDto, UsersServiceClient, GetUsersByIdsRequest } from '@app/common';
import { MarketDocument } from './schemas/market.schema';
import { SanitizationUtils } from './middleware/sanitization.middleware';

@Injectable()
export class MarketsService {
  constructor(
    private readonly marketsRepository: MarketsRepository,
    @InjectModel('Market') private readonly marketModel: Model<MarketDocument>,
    @Inject('USERS_SERVICE_CLIENT') private readonly usersServiceClient: UsersServiceClient,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(createMarketDto: CreateMarketDto, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can create markets');
    }

    // Sanitize input data
    const sanitizedData = SanitizationUtils.sanitizeMarketData(createMarketDto);

    // Enforce 1:1 relationship between vendor limit and booths available
    if (sanitizedData.vendorLimit && sanitizedData.boothsAvailable) {
      if (sanitizedData.vendorLimit !== sanitizedData.boothsAvailable) {
        throw new ForbiddenException('Vendor limit and booths available must be equal for 1:1 allocation');
      }
    } else if (sanitizedData.vendorLimit) {
      // Auto-set booths available to match vendor limit
      sanitizedData.boothsAvailable = sanitizedData.vendorLimit;
    } else if (sanitizedData.boothsAvailable) {
      // Auto-set vendor limit to match booths available
      sanitizedData.vendorLimit = sanitizedData.boothsAvailable;
    }

    // Calculate market status based on date and time
    const marketDate = new Date(sanitizedData.date);
    const now = new Date();
    const marketStartTime = new Date(sanitizedData.date + 'T' + sanitizedData.startTime);
    const marketEndTime = new Date(sanitizedData.date + 'T' + sanitizedData.endTime);
    
    let status: string;
    if (marketDate < now && now < marketEndTime) {
      status = 'ongoing';
    } else if (marketDate > now || (marketDate.getTime() === now.getTime() && marketStartTime > now)) {
      status = 'upcoming';
    } else {
      status = 'past';
    }

    return this.marketsRepository.create({
      ...sanitizedData,
      categories: Array.isArray(sanitizedData.categories) ? sanitizedData.categories : [],
      status,
      createdBy: new Types.ObjectId(user.userId),
      registeredVendors: (sanitizedData.registeredVendors || []).map(id => new Types.ObjectId(id)),
      isDeleted: false, // Ensure new markets are not deleted
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true, // Handle legacy data
    });
  }

  async createBulk(marketsData: any[], user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can create markets in bulk');
    }

    if (!Array.isArray(marketsData) || marketsData.length === 0) {
      throw new ForbiddenException('Markets data must be a non-empty array');
    }

    if (marketsData.length > 100) {
      throw new ForbiddenException('Cannot create more than 100 markets at once');
    }

    const createdMarkets = [];
    const errors = [];

    for (let i = 0; i < marketsData.length; i++) {
      try {
        const marketData = marketsData[i];
        
        // Sanitize input data
        const sanitizedData = SanitizationUtils.sanitizeMarketData(marketData);
        
        // Validate required fields
        if (!sanitizedData.name || !sanitizedData.description || !sanitizedData.location || !sanitizedData.date) {
          errors.push(`Market ${i + 1}: Missing required fields (name, description, location, or date)`);
          continue;
        }

        // Enforce 1:1 relationship between vendor limit and booths available
        if (sanitizedData.vendorLimit && sanitizedData.boothsAvailable) {
          if (sanitizedData.vendorLimit !== sanitizedData.boothsAvailable) {
            sanitizedData.boothsAvailable = sanitizedData.vendorLimit;
          }
        } else if (sanitizedData.vendorLimit) {
          sanitizedData.boothsAvailable = sanitizedData.vendorLimit;
        } else if (sanitizedData.boothsAvailable) {
          sanitizedData.vendorLimit = sanitizedData.boothsAvailable;
        }

        // Calculate market status based on date and time
        const marketDate = new Date(sanitizedData.date);
        const now = new Date();
        const marketStartTime = new Date(sanitizedData.date + 'T' + sanitizedData.startTime);
        const marketEndTime = new Date(sanitizedData.date + 'T' + sanitizedData.endTime);
        
        let status: string;
        if (marketDate < now && now < marketEndTime) {
          status = 'ongoing';
        } else if (marketDate > now || (marketDate.getTime() === now.getTime() && marketStartTime > now)) {
          status = 'upcoming';
        } else {
          status = 'past';
        }

        const market = await this.marketsRepository.create({
          ...sanitizedData,
          categories: Array.isArray(sanitizedData.categories) ? sanitizedData.categories : [],
          status,
          createdBy: new Types.ObjectId(user.userId),
          registeredVendors: (sanitizedData.registeredVendors || []).map(id => new Types.ObjectId(id)),
          isDeleted: false,
          isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
        });

        createdMarkets.push(market);
      } catch (error) {
        errors.push(`Market ${i + 1}: ${error.message}`);
      }
    }

    return {
      success: true,
      totalRequested: marketsData.length,
      created: createdMarkets.length,
      failed: errors.length,
      createdMarkets: createdMarkets,
      errors: errors
    };
  }

  async getFeaturedMarkets() {
    const filter = {
      $and: [
        { isDeleted: false },
        { isActive: true },
        { isFeatured: true },
        // Only show upcoming and ongoing featured markets
        {
          $or: [
            { status: 'upcoming' },
            { status: 'ongoing' }
          ]
        }
      ]
    };

    const markets = await this.marketsRepository.find(filter);
    return {
      data: markets.slice(0, 10),
      pagination: {
        page: 1,
        limit: 10,
        total: markets.length,
        totalPages: Math.ceil(markets.length / 10)
      }
    };
  }

  async findAll(query: any = {}) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', status, category, isActive, isFeatured, userRole, userId } = query;
    
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
    
    // If we are filtering by a specific user's participation, add that filter
    if (userId) {
      filter.$and.push({ registeredVendors: new Types.ObjectId(userId) });
    }

    // For non-admin users, automatically filter for ongoing and upcoming markets only
    if (userRole !== 'admin') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      filter.$and.push({
        $or: [
          // Upcoming markets (future dates or today but hasn't started)
          {
            $or: [
              { date: { $gt: todayEnd } }, // Future date (after today)
              {
                $and: [
                  { date: { $gte: todayStart, $lt: todayEnd } }, // Today
                  { startTime: { $gt: now.toTimeString().slice(0, 5) } } // Today but hasn't started
                ]
              }
            ]
          },
          // Ongoing markets (today and currently happening)
          {
            $and: [
              { date: { $gte: todayStart, $lt: todayEnd } }, // Today
              { startTime: { $lte: now.toTimeString().slice(0, 5) } }, // Started
              { endTime: { $gte: now.toTimeString().slice(0, 5) } } // Not ended
            ]
          }
        ]
      });
    }
    
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
    
    // Add featured filter if provided
    if (isFeatured !== undefined) {
      filter.$and.push({ isFeatured: isFeatured === 'true' });
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

    const normalized = markets.map((m: any) => {
      const idStr = m._id?.toString?.() || m._id;
      const priceNum = m.price && typeof m.price === 'object' && m.price.toString
        ? Number(m.price.toString())
        : m.price;
      return {
        ...m,
        _id: idStr,
        id: idStr,
        price: typeof priceNum === 'number' && !Number.isNaN(priceNum) ? priceNum : m.price,
        categories: Array.isArray(m.categories) ? m.categories : [],
        registeredVendors: Array.isArray(m.registeredVendors) ? m.registeredVendors : [],
      };
    });

    console.log(`Found ${normalized.length} markets out of ${total} total`);

    return {
      data: normalized,
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

    // Normalize market shape for frontend compatibility
    const marketNormalized: any = (() => {
      const m: any = (market as any).toObject ? (market as any).toObject() : market;
      const idStr = m._id?.toString?.() || m._id;
      const priceNum = m.price && typeof m.price === 'object' && m.price.toString
        ? Number(m.price.toString())
        : m.price;
      return {
        ...m,
        _id: idStr,
        id: idStr,
        price: typeof priceNum === 'number' && !Number.isNaN(priceNum) ? priceNum : m.price,
        categories: Array.isArray(m.categories) ? m.categories : [],
        registeredVendors: Array.isArray(m.registeredVendors) ? m.registeredVendors : [],
      };
    })();

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
      market: marketNormalized,
      vendors: vendors.data,
      pagination: vendors.pagination,
      statistics: marketStats,
    };
  }

  async update(id: string, updateMarketDto: UpdateMarketDto, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update markets');
    }
    
    // Sanitize input data
    const sanitizedData = SanitizationUtils.sanitizeMarketData(updateMarketDto);
    
    // Enforce 1:1 relationship between vendor limit and booths available
    if (sanitizedData.vendorLimit && sanitizedData.boothsAvailable) {
      if (sanitizedData.vendorLimit !== sanitizedData.boothsAvailable) {
        throw new ForbiddenException('Vendor limit and booths available must be equal for 1:1 allocation');
      }
    } else if (sanitizedData.vendorLimit) {
      // Auto-set booths available to match vendor limit
      sanitizedData.boothsAvailable = sanitizedData.vendorLimit;
    } else if (sanitizedData.boothsAvailable) {
      // Auto-set vendor limit to match booths available
      sanitizedData.vendorLimit = sanitizedData.boothsAvailable;
    }

    // Ensure isDeleted field exists for legacy data
    if (sanitizedData.isDeleted === undefined) {
      sanitizedData.isDeleted = false;
    }
    
    // Convert registeredVendors to ObjectIds if they exist
    const updateData = { ...sanitizedData };
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
    // Clear existing markets to ensure fresh seeding
    await this.marketModel.deleteMany({});

    // Fetch admin (creator) and seller users from users collection directly
    const usersCollection = this.connection.collection('users');
    const adminUser = await usersCollection.findOne({ role: 'admin' });
    const sellerUsers = await usersCollection
      .find({ role: 'seller', isActive: { $ne: false } })
      .project({ _id: 1 })
      .toArray();

    const sellerIds = sellerUsers.map(u => new Types.ObjectId(u._id));

    // Compute future dates (>= 2025-09-08)
    const floorDate = new Date('2025-09-08T00:00:00Z');
    const now = new Date();
    const base = now > floorDate ? now : floorDate;

    function futureDate(daysAhead: number): string {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + daysAhead);
      // MarketsService.create expects date as string (later converted), so use ISO date (YYYY-MM-DD)
      return d.toISOString().slice(0, 10);
    }

    // Helper to pick a subset of sellers for a market
    function pickVendors(maxCount: number): string[] {
      const shuffled = [...sellerIds].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(maxCount, shuffled.length)).map(id => id.toString());
    }

    const adminId = adminUser ? new Types.ObjectId(adminUser._id).toString() : (sellerIds[0]?.toString() || new Types.ObjectId().toString());

    const marketsData = [
      {
        name: 'Autumn Flea Market',
        description: 'Seasonal market featuring local vendors, crafts, and vintage goods.',
        location: 'Central Park, Downtown',
        date: futureDate(7),
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        createdBy: adminId,
        bannerImage: 'https://example.com/autumn-market.jpg',
        vendorLimit: 30,
        boothsAvailable: 30,
        categories: ['Crafts', 'Vintage', 'Food'],
        status: 'upcoming',
        registeredVendors: pickVendors(20),
        isDeleted: false,
      },
      {
        name: 'Tech & Games Bazaar',
        description: 'Gadgets, gaming gear, and electronics by local sellers.',
        location: 'Innovation Square',
        date: futureDate(14),
        startTime: '10:00',
        endTime: '18:00',
        isActive: true,
        createdBy: adminId,
        bannerImage: 'https://example.com/tech-bazaar.jpg',
        vendorLimit: 25,
        boothsAvailable: 25,
        categories: ['Electronics', 'Gaming', 'Computers'],
        status: 'upcoming',
        registeredVendors: pickVendors(15),
        isDeleted: false,
      },
      {
        name: 'Home & Garden Fair',
        description: 'Furniture, decor, and garden finds for every home.',
        location: 'Greenfield Expo Grounds',
        date: futureDate(21),
        startTime: '08:30',
        endTime: '16:00',
        isActive: true,
        createdBy: adminId,
        bannerImage: 'https://example.com/home-garden.jpg',
        vendorLimit: 40,
        boothsAvailable: 40,
        categories: ['Home', 'Garden', 'Decor'],
        status: 'upcoming',
        registeredVendors: pickVendors(25),
        isDeleted: false,
      },
    ];

    // Create markets via repository to apply conversions and defaults
    const createdMarkets = await Promise.all(
      marketsData.map(market => this.marketsRepository.create(market))
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