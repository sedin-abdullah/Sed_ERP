import { Document, Model, Schema, Types, model } from 'mongoose';
import type { CommandName } from '../mqtt/topics';

export type AckStatus = 'pending' | 'ok' | 'error' | 'timeout';

export interface IMachineCommand extends Document {
  machineId: Types.ObjectId;
  machineName: string;
  command: CommandName;
  payload?: unknown;
  commandId: string;
  issuedBy: Types.ObjectId;
  issuedByName: string;
  issuedAt: Date;
  ackStatus: AckStatus;
  ackAt?: Date;
  ackMessage?: string;
}

const machineCommandSchema = new Schema<IMachineCommand>(
  {
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', required: true, index: true },
    machineName: { type: String, default: '' },
    command: {
      type: String,
      enum: ['power_on', 'power_off', 'restart', 'alert', 'set_param', 'clear_alerts', 'broadcast_alert'],
      required: true,
    },
    payload: Schema.Types.Mixed,
    commandId: { type: String, required: true, unique: true, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedByName: { type: String, default: '' },
    issuedAt: { type: Date, default: Date.now, index: true },
    ackStatus: { type: String, enum: ['pending', 'ok', 'error', 'timeout'], default: 'pending' },
    ackAt: { type: Date },
    ackMessage: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const MachineCommand: Model<IMachineCommand> = model<IMachineCommand>('MachineCommand', machineCommandSchema);
