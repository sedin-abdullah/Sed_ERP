import { Document, Model, model, Schema, Types } from 'mongoose';

export type JobStatus = 'scheduled' | 'en_route' | 'on_site' | 'completed';

export const JOB_STATUSES: JobStatus[] = ['scheduled', 'en_route', 'on_site', 'completed'];

export interface IJob extends Document {
  code: string;
  requestId: Types.ObjectId;
  requestTitle: string;
  technicianId: Types.ObjectId;
  technicianName: string;
  status: JobStatus;
  scheduledFor?: Date;
  notes?: string;
}

const jobSchema = new Schema<IJob>(
  {
    code: { type: String, required: true, unique: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    requestTitle: { type: String, required: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'Technician', required: true },
    technicianName: { type: String, required: true },
    status: { type: String, enum: JOB_STATUSES, default: 'scheduled' },
    scheduledFor: { type: Date },
    notes: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Job: Model<IJob> = model<IJob>('Job', jobSchema);
