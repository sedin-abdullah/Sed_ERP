import net from 'net';
import { env } from '../config/env';

/**
 * Resolves the MQTT broker URL. If MQTT_URL is set we use that external broker
 * (e.g. a local Mosquitto). Otherwise we start an embedded aedes broker on a
 * plain TCP port and return its URL — this is what makes the MQTT layer work on
 * Render free tier, where no separate broker process can run.
 *
 * aedes v1 is ESM-only, so it's pulled in via dynamic import() (works from our
 * CommonJS build under NodeNext).
 */
export async function startBroker(): Promise<string> {
  if (env.MQTT_URL) {
    console.log(`[mqtt] using external broker ${env.MQTT_URL}`);
    return env.MQTT_URL;
  }

  const { Aedes } = await import('aedes');
  // aedes v1 requires the async factory (constructor doesn't finish wiring the
  // broker), otherwise client CONNECT packets hang.
  const aedes = await Aedes.createBroker();
  const server = net.createServer((socket) => aedes.handle(socket));
  const port = env.MQTT_BROKER_PORT;

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  console.log(`[mqtt] embedded aedes broker listening on 127.0.0.1:${port}`);
  return `mqtt://127.0.0.1:${port}`;
}
