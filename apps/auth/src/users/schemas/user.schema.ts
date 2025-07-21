import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';

import { UserRole } from '@app/common';

@Schema({ versionKey: false, timestamps: true })
export class User extends AbstractDocument {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  displayName: string;

  @Prop()
  bio?: string;

  @Prop()
  avatar?: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.BUYER,
    type: String,
  })
  role: UserRole;

  @Prop()
  city?: string;

  @Prop()
  neighborhood?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop()
  phoneNumber?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  totalSales: number;

  @Prop({ default: 0 })
  totalPurchases: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastSeen?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for geospatial queries and search
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ city: 1, neighborhood: 1 });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
