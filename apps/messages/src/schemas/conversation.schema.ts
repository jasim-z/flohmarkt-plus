import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participantIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Listing' })
  listingId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Market' })
  marketId?: Types.ObjectId;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  @Prop({ type: String })
  lastMessage?: string;

  @Prop({ type: Object, default: { buyer: 0, seller: 0 } })
  unreadCounts?: { buyer: number; seller: number };
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participantIds: 1 });
ConversationSchema.index({ participantIds: 1, listingId: 1 }, { unique: false });

