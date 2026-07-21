import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { initSocket } from './sockets/io';
import { startSimulator } from './simulator/iot';
import { seedAccounts } from './config/seedAccounts';

async function start(): Promise<void> {
  await connectDB();

  // Ensure demo login accounts exist (idempotent). Render free tier has no
  // shell, so this is how prod gets its accounts. Disable with SEED_ON_BOOT=false.
  if (env.SEED_ON_BOOT) {
    const count = await seedAccounts();
    console.log(`[seed] ${count} demo accounts ensured`);
  }

  const server = http.createServer(app);
  initSocket(server);

  // Live IoT stream: seeds machines + emits iot:update / alert events.
  await startSimulator();

  server.listen(env.PORT, () => {
    console.log(`[server] SedERP API on :${env.PORT} (${env.NODE_ENV})`);
    console.log(`[server] Health: http://localhost:${env.PORT}/api/v1/health`);
  });
}

start().catch((err) => {
  console.error('[fatal] Failed to start server:', err);
  process.exit(1);
});
