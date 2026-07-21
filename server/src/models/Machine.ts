import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IMachine extends Document {
  name: string;
  type: string;
  location: string;
  gatewayId: string;
  online: boolean;
  healthScore: number;
  ownerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const machineSchema = new Schema<IMachine>(
  {
    name: { type: String, required: true },
    type: { type: String, default: 'Generic' },
    location: { type: String, default: '' },
    gatewayId: { type: String, default: '' },
    online: { type: Boolean, default: true },
    healthScore: { type: Number, default: 100 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Machine: Model<IMachine> = model<IMachine>('Machine', machineSchema);
