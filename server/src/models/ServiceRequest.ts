import { Document, Model, model, Schema, Types } from 'mongoose';

export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequestStatus =
  | 'pending'
  | 'quoted'
  | 'approved'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const REQUEST_CATEGORIES = [
  'maintenance',
  'repair',
  'installation',
  'consulting',
  'monitoring',
  'parts',
] as const;

export interface IServiceRequest extends Document {
  code: string;
  title: string;
  category: string;
  description: string;
  priority: RequestPriority;
  machineName?: string;
  location: string;
  requesterId?: Types.ObjectId;
  requesterName: string;
  status: RequestStatus;
  quoteId?: Types.ObjectId;
  jobId?: Types.ObjectId;
}

const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    machineName: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User' },
    requesterName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'quoted', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const ServiceRequest: Model<IServiceRequest> = model<IServiceRequest>('ServiceRequest', serviceRequestSchema);
