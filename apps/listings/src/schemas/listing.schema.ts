import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ItemCondition, ItemCategory, DeliveryOption } from '@app/common';

export type ListingDocument = Listing & Document;

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  DELETED = 'deleted',
  PENDING = 'pending',
  FLAGGED = 'flagged',
}

@Schema({ timestamps: true })
export class Listing {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: false })
  isFree: boolean;

  @Prop({ required: true, enum: ItemCategory, type: String })
  category: ItemCategory;

  @Prop({ required: true, enum: ItemCondition, type: String })
  condition: ItemCondition;

  @Prop({ type: [String], required: false, default: [] })
  images?: string[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Market' })
  marketId?: Types.ObjectId;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  neighborhood: string;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  @Prop({ required: true, enum: DeliveryOption, type: String })
  deliveryOption: DeliveryOption;

  @Prop({ min: 0 })
  shippingCost?: number;

  @Prop()
  brand?: string;

  @Prop()
  model?: string;

  @Prop({ min: 0 })
  originalPrice?: number;

  @Prop()
  dimensions?: string;

  @Prop()
  weight?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isNegotiable: boolean;

  @Prop()
  pickupAddress?: string;

  @Prop()
  pickupInstructions?: string;

  @Prop({ default: ListingStatus.ACTIVE, enum: ListingStatus, type: String })
  status: ListingStatus;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  favoriteCount: number;

  @Prop({ default: 0 })
  offerCount: number;

  @Prop({ type: Date })
  soldAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  soldTo?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  flags: string[];

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastUpdated: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

// Indexes for search and geospatial queries
ListingSchema.index({ location: '2dsphere' });
ListingSchema.index({ city: 1, neighborhood: 1 });
ListingSchema.index({ category: 1 });
ListingSchema.index({ sellerId: 1 });
ListingSchema.index({ status: 1 });
ListingSchema.index({ price: 1 });
ListingSchema.index({ createdAt: -1 });
ListingSchema.index({ title: 'text', description: 'text', tags: 'text' });
ListingSchema.index({ isDeleted: 1 }); 