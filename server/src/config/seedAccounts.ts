/**
 * Idempotent demo-account seeding, shared by the CLI seed (`npm run seed`)
 * and the boot-time hook in server.ts (so prod has login accounts without a
 * shell — Render free tier has none). Safe to run repeatedly: each account is
 * upserted by email.
 */
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS, Permission, User } from '../models/User';

const USER_PERMISSIONS: Permission[] = [
  'canRequestService',
  'canRequestQuote',
  'canCancelRequest',
  'canRateTechnician',
];

export interface SeedAccount {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'technician';
  permissions: Permission[];
}

export const DEMO_ACCOUNTS: SeedAccount[] = [
  { name: 'SedERP Admin', email: 'admin@sederp.com', password: 'Admin@123', role: 'admin', permissions: [...ALL_PERMISSIONS] },
  { name: 'Olivia Operator', email: 'user1@sederp.com', password: 'User@123', role: 'user', permissions: USER_PERMISSIONS },
  { name: 'Ravi Plant', email: 'user2@sederp.com', password: 'User@123', role: 'user', permissions: USER_PERMISSIONS },
  { name: 'Tariq Tech', email: 'tech1@sederp.com', password: 'Tech@123', role: 'technician', permissions: [] },
  { name: 'Maria Field', email: 'tech2@sederp.com', password: 'Tech@123', role: 'technician', permissions: [] },
  { name: 'Chen Service', email: 'tech3@sederp.com', password: 'Tech@123', role: 'technician', permissions: [] },
];

/**
 * Upsert every demo account. When `log` is true (CLI), prints each row.
 * Returns the number of accounts processed.
 */
export async function seedAccounts(log = false): Promise<number> {
  for (const a of DEMO_ACCOUNTS) {
    // eslint-disable-next-line no-await-in-loop
    const passwordHash = await bcrypt.hash(a.password, 10);
    // eslint-disable-next-line no-await-in-loop
    await User.findOneAndUpdate(
      { email: a.email },
      { name: a.name, email: a.email, passwordHash, role: a.role, permissions: a.permissions, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (log) console.log(`  ✓ ${a.role.padEnd(10)} ${a.email}  (${a.password})`);
  }
  return DEMO_ACCOUNTS.length;
}
