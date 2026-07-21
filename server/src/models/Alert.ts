import { Document, Model, Schema, Types, model } from 'mongoose';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'ack' | 'resolved';

export interface IAlert extends Document {
  machineId: Types.ObjectId;
  machineName: string;
  metric: string; // temperature | vibration | status | energy | admin
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  source: 'auto' | 'admin';
  issuedBy?: Types.ObjectId;
  acknowledgedBy?: Types.ObjectId;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', index: true },
    machineName: { type: String, required: true },
    metric: { type: String, default: 'status' },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    message: { type: String, required: true },
    status: { type: String, enum: ['active', 'ack', 'resolved'], default: 'active', index: true },
    source: { type: String, enum: ['auto', 'admin'], default: 'auto' },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Alert: Model<IAlert> = model<IAlert>('Alert', alertSchema);
