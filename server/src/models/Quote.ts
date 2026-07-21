import { Document, Model, model, Schema, Types } from 'mongoose';

export type QuoteStatus = 'sent' | 'accepted' | 'rejected';

export interface IQuote extends Document {
  requestId: Types.ObjectId;
  amount: number;
  currency: string;
  notes?: string;
  validUntil?: Date;
  status: QuoteStatus;
  createdBy?: Types.ObjectId;
}

const quoteSchema = new Schema<IQuote>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    notes: { type: String },
    validUntil: { type: Date },
    status: { type: String, enum: ['sent', 'accepted', 'rejected'], default: 'sent' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Quote: Model<IQuote> = model<IQuote>('Quote', quoteSchema);
