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

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  postalCode?: string;

  @Prop()
  country?: string;

  @Prop()
  state?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  // Start date of the market
  @Prop({ required: true, type: Date })
  date: Date;

  // End date of the market (new)
  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  bannerImage?: string;

  @Prop({ type: [String], default: [] })
  additionalImages: string[];

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
MarketSchema.index({ latitude: 1, longitude: 1 });
MarketSchema.index({ city: 1, postalCode: 1 });
MarketSchema.index({ country: 1, state: 1, city: 1 });
MarketSchema.index({ status: 1 });
MarketSchema.index({ createdBy: 1 });
MarketSchema.index({ name: 'text', description: 'text', categories: 'text' });
MarketSchema.index({ isDeleted: 1 }); 

// Ensure consistent JSON shape across responses
MarketSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    // @ts-ignore assign dynamic id for client consumption
    if (ret._id) {
      // @ts-ignore
      ret.id = ret._id.toString();
      delete ret._id;
    }
    // Normalize Decimal128 price to number if present, but do not change type definition here
    if (ret.price && typeof ret.price === 'object' && ret.price.toString) {
      const priceNum = Number(ret.price.toString());
      // expose a numeric copy for clients while keeping original field if needed
      // @ts-ignore
      ret.priceNumber = Number.isNaN(priceNum) ? undefined : priceNum;
    }
    // Ensure arrays default
    if (!Array.isArray(ret.categories)) ret.categories = [];
    if (!Array.isArray(ret.registeredVendors)) ret.registeredVendors = [];
    return ret;
  },
});