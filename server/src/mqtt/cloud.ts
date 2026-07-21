import { MqttClient } from 'mqtt';
import { Alert } from '../models/Alert';
import { MachineCommand } from '../models/MachineCommand';
import { broadcast } from '../sockets/io';
import { connectBus } from './bus';
import {
  AckMessage, CommandMessage, StatusMessage, TargetedAlertMessage, TelemetryMessage,
  machineIdFromTopic, topics,
} from './topics';

const EMIT_MS = 2500;
const ACK_TIMEOUT_MS = 5000;

interface Thresholds { maxTemperature: number; maxVibration: number }
const DEFAULT_THRESHOLDS: Thresholds = { maxTemperature: 92, maxVibration: 8 };

let cloud: MqttClient | null = null;
const latest = new Map<string, TelemetryMessage>();
const thresholds = new Map<string, Thresholds>();
const activeAlerts = new Map<string, string>(); // `${machineId}:${metric}` -> alertId
const pending = new Map<string, NodeJS.Timeout>(); // commandId -> timeout handle

function getThresholds(id: string): Thresholds {
  let t = thresholds.get(id);
  if (!t) { t = { ...DEFAULT_THRESHOLDS }; thresholds.set(id, t); }
  return t;
}

export function setThreshold(id: string, key: string, value: number): void {
  const t = getThresholds(id);
  if (key === 'maxTemperature') t.maxTemperature = value;
  if (key === 'maxVibration') t.maxVibration = value;
}

async function openAlert(machineId: string, machineName: string, metric: string, severity: 'warning' | 'critical', message: string) {
  const key = `${machineId}:${metric}`;
  if (activeAlerts.has(key)) return;
  const alert = await Alert.create({ machineId, machineName, metric, severity, message, status: 'active', source: 'auto' });
  activeAlerts.set(key, String(alert._id));
  broadcast('alert:new', alert.toJSON());
}

async function clearAlert(machineId: string, metric: string) {
  const key = `${machineId}:${metric}`;
  const id = activeAlerts.get(key);
  if (!id) return;
  activeAlerts.delete(key);
  const alert = await Alert.findById(id);
  if (alert && alert.status !== 'resolved') {
    alert.status = 'resolved';
    await alert.save();
    broadcast('alert:cleared', { id, machineId });
  }
}

async function detectAlerts(t: TelemetryMessage) {
  const th = getThresholds(t.machineId);
  if (t.status === 'fault') {
    await openAlert(t.machineId, t.name, 'status', 'critical', `${t.name} reported a FAULT state`);
  } else {
    await clearAlert(t.machineId, 'status');
  }
  if (t.status === 'running' && t.temperature > th.maxTemperature) {
    await openAlert(t.machineId, t.name, 'temperature', 'critical', `${t.name} temperature high (${t.temperature}°C)`);
  } else if (t.temperature < th.maxTemperature - 4) {
    await clearAlert(t.machineId, 'temperature');
  }
  if (t.status === 'running' && t.vibration > th.maxVibration) {
    await openAlert(t.machineId, t.name, 'vibration', 'warning', `${t.name} vibration spike (${t.vibration} mm/s)`);
  } else if (t.vibration < th.maxVibration - 1.5) {
    await clearAlert(t.machineId, 'vibration');
  }
}

/** Starts the cloud MQTT consumer: telemetry/status/ack -> DB + Socket.IO. */
export function startCloudConsumer(url: string): void {
  cloud = connectBus('cloud', url);

  cloud.on('connect', () => {
    cloud!.subscribe([topics.allTelemetry, topics.allStatus, topics.allAck], { qos: 1 });
    console.log('[mqtt:cloud] subscribed to telemetry/status/ack');
  });

  cloud.on('message', (topic, buf) => {
    void handleMessage(topic, buf).catch((e) => console.error('[mqtt:cloud] handler error', e));
  });

  // Coalesced live snapshot to all Socket.IO clients (keeps the existing
  // iot:update contract the frontend already consumes).
  setInterval(() => {
    if (latest.size) broadcast('iot:update', { ts: Date.now(), machines: [...latest.values()] });
  }, EMIT_MS);
}

async function handleMessage(topic: string, buf: Buffer): Promise<void> {
  const id = machineIdFromTopic(topic);
  if (topic.endsWith('/telemetry') && id) {
    const t = JSON.parse(buf.toString()) as TelemetryMessage;
    latest.set(id, t);
    await detectAlerts(t);
  } else if (topic.endsWith('/status') && id) {
    const s = JSON.parse(buf.toString()) as StatusMessage;
    const prev = latest.get(id);
    if (prev) latest.set(id, { ...prev, status: s.status });
    broadcast('machine:status', { machineId: id, status: s.status });
    // A stopped/idle machine can't hold live condition alerts.
    if (s.status === 'off' || s.status === 'idle') {
      await clearAlert(id, 'temperature');
      await clearAlert(id, 'vibration');
    }
    if (s.status === 'off') await clearAlert(id, 'status');
  } else if (topic.endsWith('/ack')) {
    const a = JSON.parse(buf.toString()) as AckMessage;
    const to = pending.get(a.commandId);
    if (to) { clearTimeout(to); pending.delete(a.commandId); }
    const cmd = await MachineCommand.findOne({ commandId: a.commandId });
    if (cmd && cmd.ackStatus === 'pending') {
      cmd.ackStatus = a.status === 'ok' ? 'ok' : 'error';
      cmd.ackAt = new Date();
      cmd.ackMessage = a.message;
      await cmd.save();
      broadcast('machine:command-ack', cmd.toJSON());
    }
  }
}

function ensureCloud(): MqttClient {
  if (!cloud) throw new Error('MQTT cloud consumer not started');
  return cloud;
}

/** Publish an admin command to a machine and arm the ack timeout. */
export function publishCommand(machineId: string, msg: CommandMessage): void {
  ensureCloud().publish(topics.commands(machineId), JSON.stringify(msg), { qos: 1 });
  const to = setTimeout(() => { void expireCommand(msg.commandId); }, ACK_TIMEOUT_MS);
  pending.set(msg.commandId, to);
}

async function expireCommand(commandId: string): Promise<void> {
  pending.delete(commandId);
  const cmd = await MachineCommand.findOne({ commandId });
  if (cmd && cmd.ackStatus === 'pending') {
    cmd.ackStatus = 'timeout';
    cmd.ackAt = new Date();
    cmd.ackMessage = 'No acknowledgement within 5s';
    await cmd.save();
    broadcast('machine:command-ack', cmd.toJSON());
  }
}

export function publishTargetedAlert(machineId: string, msg: TargetedAlertMessage): void {
  ensureCloud().publish(topics.alerts(machineId), JSON.stringify(msg), { qos: 1 });
}

export function publishBroadcastAlert(msg: TargetedAlertMessage): void {
  ensureCloud().publish(topics.broadcastAlerts, JSON.stringify(msg), { qos: 1 });
}
