/**
 * Seeds SedERP with demo accounts: 1 admin, 2 users (with granular
 * permissions), 3 technicians. Run: `npm run seed`.
 *
 * The same accounts are also upserted on server boot (see server.ts +
 * SEED_ON_BOOT) so prod has login accounts without a shell.
 */
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { seedAccounts } from './config/seedAccounts';

async function run(): Promise<void> {
  await connectDB();
  const count = await seedAccounts(true);
  console.log(`\n✅ Seed complete (${count} accounts).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
