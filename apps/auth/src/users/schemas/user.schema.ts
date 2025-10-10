import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';

import { UserRole } from '@app/common';

@Schema({ versionKey: false, timestamps: true })
export class User extends AbstractDocument {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  displayName?: string;

  @Prop({ required: true })
  name: string;

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

  @Prop()
  postalCode?: string;

  @Prop()
  address?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop()
  country?: string;

  @Prop()
  state?: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationToken?: string;

  @Prop({ type: Date })
  verificationTokenExpiry?: Date;

  @Prop()
  resetPasswordToken?: string;

  @Prop({ type: Date })
  resetPasswordTokenExpiry?: Date;

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

  // Timestamps added by Mongoose when timestamps: true is set
  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for geospatial queries and search
UserSchema.index({ latitude: 1, longitude: 1 });
UserSchema.index({ city: 1, neighborhood: 1 });
UserSchema.index({ postalCode: 1 });
UserSchema.index({ country: 1, state: 1, city: 1 });
// Unique index for email is already defined via @Prop({ unique: true })
UserSchema.index({ role: 1 });
