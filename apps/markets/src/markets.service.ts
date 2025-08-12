import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MarketsRepository } from './markets.repository';
import { CreateMarketDto, UpdateMarketDto } from '@app/common';
import { Types } from 'mongoose';

@Injectable()
export class MarketsService {
  constructor(private readonly marketsRepository: MarketsRepository) {}

  async create(createMarketDto: CreateMarketDto, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can create markets');
    }
    return this.marketsRepository.create({
      ...createMarketDto,
      createdBy: new Types.ObjectId(user.userId),
      registeredVendors: (createMarketDto.registeredVendors || []).map(id => new Types.ObjectId(id)),
    });
  }

  async findAll(query: any = {}) {
    return this.marketsRepository.find(query);
  }

  async findByUser(userId: string) {
    return this.marketsRepository.find({
      registeredVendors: new Types.ObjectId(userId),
      isActive: true
    });
  }

  async addUserToMarket(marketId: string, userId: string) {
    const market = await this.marketsRepository.findOne({ _id: new Types.ObjectId(marketId) });
    if (!market) throw new NotFoundException('Market not found');
    
    if (!market.registeredVendors.includes(new Types.ObjectId(userId))) {
      return this.marketsRepository.findOneAndUpdate(
        { _id: new Types.ObjectId(marketId) },
        { $push: { registeredVendors: new Types.ObjectId(userId) } }
      );
    }
    
    return market;
  }

  async findOne(id: string) {
    const market = await this.marketsRepository.findOne({ _id: new Types.ObjectId(id) });
    if (!market) throw new NotFoundException('Market not found');
    return market;
  }

  async update(id: string, updateMarketDto: UpdateMarketDto, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update markets');
    }
    return this.marketsRepository.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      { ...updateMarketDto }
    );
  }

  async remove(id: string, user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete markets');
    }
    return this.marketsRepository.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      { isActive: false }
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
        createdBy: new Types.ObjectId('507f1f77bcf86cd799439011'), // Mock admin ID
        bannerImage: 'https://example.com/spring-market.jpg',
        vendorLimit: 50,
        boothsAvailable: 45,
        categories: ['Crafts', 'Vintage', 'Food', 'Art'],
        status: 'upcoming',
        registeredVendors: []
      },
      {
        name: 'Vintage Collectors Fair',
        description: 'Specialized market for vintage and antique items, perfect for collectors and enthusiasts.',
        location: 'Historic District',
        date: new Date('2024-02-20'),
        startTime: '10:00',
        endTime: '17:00',
        isActive: true,
        createdBy: new Types.ObjectId('507f1f77bcf86cd799439011'),
        bannerImage: 'https://example.com/vintage-fair.jpg',
        vendorLimit: 30,
        boothsAvailable: 25,
        categories: ['Vintage', 'Antiques', 'Collectibles'],
        status: 'past',
        registeredVendors: []
      },
      {
        name: 'Artisan Craft Market',
        description: 'Handmade crafts and unique artistic creations from local artisans and craftspeople.',
        location: 'Arts Quarter',
        date: new Date('2024-01-10'),
        startTime: '11:00',
        endTime: '19:00',
        isActive: true,
        createdBy: new Types.ObjectId('507f1f77bcf86cd799439011'),
        bannerImage: 'https://example.com/artisan-market.jpg',
        vendorLimit: 40,
        boothsAvailable: 35,
        categories: ['Crafts', 'Art', 'Handmade', 'Jewelry'],
        status: 'past',
        registeredVendors: []
      }
    ];

    const createdMarkets = await Promise.all(
      testMarkets.map(market => this.marketsRepository.create(market))
    );

    return { message: 'Markets seeded successfully', count: createdMarkets.length };
  }
} 