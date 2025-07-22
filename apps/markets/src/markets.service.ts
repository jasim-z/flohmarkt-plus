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
} 