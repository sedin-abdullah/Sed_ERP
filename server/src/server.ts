import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { initSocket } from './sockets/io';
import { startSimulator } from './simulator/iot';
import { startBroker } from './mqtt/broker';
import { startCloudConsumer } from './mqtt/cloud';
import { seedAccounts } from './config/seedAccounts';
import { seedServiceDemo } from './config/seedService';

async function start(): Promise<void> {
  await connectDB();

  // Ensure demo login accounts + SedService demo data exist (idempotent).
  // Render free tier has no shell, so this is how prod gets seeded.
  // Disable with SEED_ON_BOOT=false.
  if (env.SEED_ON_BOOT) {
    const count = await seedAccounts();
    console.log(`[seed] ${count} demo accounts ensured`);
    await seedServiceDemo();
  }

  const server = http.createServer(app);
  initSocket(server);

  // MQTT layer: broker (embedded aedes unless MQTT_URL is set) → cloud consumer
  // (telemetry/status/ack → Socket.IO + alerts) → device simulator.
  const brokerUrl = await startBroker();
  startCloudConsumer(brokerUrl);
  await startSimulator(brokerUrl);

  server.listen(env.PORT, () => {
    console.log(`[server] SedERP API on :${env.PORT} (${env.NODE_ENV})`);
    console.log(`[server] Health: http://localhost:${env.PORT}/api/v1/health`);
  });
}

start().catch((err) => {
  console.error('[fatal] Failed to start server:', err);
  process.exit(1);
});
