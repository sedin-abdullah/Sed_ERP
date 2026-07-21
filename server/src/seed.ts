/**
 * Seeds SedERP with demo accounts: 1 admin, 2 users (with granular
 * permissions), 3 technicians. Run: `npm run seed`.
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { ALL_PERMISSIONS, Permission, User } from './models/User';

const USER_PERMISSIONS: Permission[] = [
  'canRequestService',
  'canRequestQuote',
  'canCancelRequest',
  'canRateTechnician',
];

async function run(): Promise<void> {
  await connectDB();
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const accounts = [
    { name: 'SedERP Admin', email: 'admin@sederp.com', password: 'Admin@123', role: 'admin' as const, permissions: [...ALL_PERMISSIONS] },
    { name: 'Olivia Operator', email: 'user1@sederp.com', password: 'User@123', role: 'user' as const, permissions: USER_PERMISSIONS },
    { name: 'Ravi Plant', email: 'user2@sederp.com', password: 'User@123', role: 'user' as const, permissions: USER_PERMISSIONS },
    { name: 'Tariq Tech', email: 'tech1@sederp.com', password: 'Tech@123', role: 'technician' as const, permissions: [] },
    { name: 'Maria Field', email: 'tech2@sederp.com', password: 'Tech@123', role: 'technician' as const, permissions: [] },
    { name: 'Chen Service', email: 'tech3@sederp.com', password: 'Tech@123', role: 'technician' as const, permissions: [] },
  ];

  for (const a of accounts) {
    // eslint-disable-next-line no-await-in-loop
    await User.findOneAndUpdate(
      { email: a.email },
      { name: a.name, email: a.email, passwordHash: await hash(a.password), role: a.role, permissions: a.permissions, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  ✓ ${a.role.padEnd(10)} ${a.email}  (${a.password})`);
  }

  console.log('\n✅ Seed complete.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
