import { Document, Model, model, Schema } from 'mongoose';

export type TechnicianStatus = 'available' | 'busy' | 'off';

export interface ITechnician extends Document {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  region: string;
  status: TechnicianStatus;
  rating: number;
  completedJobs: number;
  active: boolean;
}

const technicianSchema = new Schema<ITechnician>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    skills: [{ type: String }],
    region: { type: String, required: true, trim: true },
    status: { type: String, enum: ['available', 'busy', 'off'], default: 'available' },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    completedJobs: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Technician: Model<ITechnician> = model<ITechnician>('Technician', technicianSchema);
