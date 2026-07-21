import mqtt, { MqttClient } from 'mqtt';

/** Connect a named MQTT client to the broker. `name` becomes part of the
 *  clientId so device/cloud connections are distinguishable in logs. */
export function connectBus(name: string, url: string): MqttClient {
  const client = mqtt.connect(url, {
    clientId: `sederp-${name}-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 2000,
    clean: true,
  });
  client.on('error', (err) => console.error(`[mqtt:${name}] error`, err.message));
  return client;
}

/** Minimal UUID v4 (no external dep) for command ids. */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
