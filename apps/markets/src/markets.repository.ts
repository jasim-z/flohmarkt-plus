import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { AbstractRepository } from '@app/common/database/abstract.repository';
import { MarketDocument } from './schemas/market.schema';

@Injectable()
export class MarketsRepository extends AbstractRepository<MarketDocument> {
  protected readonly logger = new Logger(MarketsRepository.name);

  constructor(
    @InjectModel('Market') marketModel: Model<MarketDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(marketModel, connection);
  }
} 