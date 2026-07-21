import bcrypt from 'bcryptjs';
import { Document, Model, Schema, model } from 'mongoose';

export type Role = 'admin' | 'user' | 'technician';

/** Granular permissions granted per user by an admin (SedService RBAC). */
export const ALL_PERMISSIONS = [
  'canRequestService',
  'canRequestQuote',
  'canViewAllRequests',
  'canCancelRequest',
  'canRateTechnician',
  'canAccessReports',
  'canManageTechnicians',
  'canManageUsers',
] as const;
export type Permission = (typeof ALL_PERMISSIONS)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  language: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user', 'technician'], default: 'user' },
    active: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    permissions: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User: Model<IUser> = model<IUser>('User', userSchema);
