import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AbstractDocument } from '@app/common/database/abstract.schema';
import { MarketStatus } from '../../../../libs/common/src/dto/market/create-market.dto';

export type MarketDocument = Market & Document;

@Schema({ timestamps: true })
export class Market extends AbstractDocument {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  bannerImage: string;

  @Prop({ type: Number })
  vendorLimit?: number;

  @Prop({ type: Number })
  boothsAvailable?: number;

  @Prop({ type: Types.Decimal128, required: true, default: 0 })
  price: Types.Decimal128;

  @Prop({ type: [String], required: true })
  categories: string[];

  @Prop({ required: true, enum: MarketStatus, type: String })
  status: MarketStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  registeredVendors: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const MarketSchema = SchemaFactory.createForClass(Market);

// Indexes for search and queries
MarketSchema.index({ location: 1, date: 1 });
MarketSchema.index({ status: 1 });
MarketSchema.index({ createdBy: 1 });
MarketSchema.index({ name: 'text', description: 'text', categories: 'text' });
MarketSchema.index({ isDeleted: 1 }); 