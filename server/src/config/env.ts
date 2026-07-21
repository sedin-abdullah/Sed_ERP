import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 5100),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/sederp'),
  JWT_SECRET: required('JWT_SECRET', 'dev-secret-change-me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  // Support a comma-separated list of allowed origins.
  CLIENT_URLS: (process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Idempotently upsert the demo accounts on boot. Defaults on so prod (no
  // shell on Render free tier) gets login accounts; set SEED_ON_BOOT=false
  // to disable.
  SEED_ON_BOOT: (process.env.SEED_ON_BOOT ?? 'true').toLowerCase() !== 'false',
  // MQTT: if MQTT_URL is set (e.g. a real Mosquitto: mqtt://localhost:1883),
  // connect to it. Otherwise start an embedded aedes broker on
  // MQTT_BROKER_PORT and connect to that — so the deployed app (Render free
  // tier, no external broker) still runs the full MQTT layer.
  MQTT_URL: process.env.MQTT_URL, // undefined => embedded broker
  MQTT_BROKER_PORT: Number(process.env.MQTT_BROKER_PORT ?? 1883),
};

export const isProduction = env.NODE_ENV === 'production';
