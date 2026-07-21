import { MqttClient } from 'mqtt';
import { Machine, IMachine } from '../models/Machine';
import { connectBus } from '../mqtt/bus';
import {
  AckMessage, CommandMessage, StatusMessage, TelemetryMessage, machineIdFromTopic, topics,
} from '../mqtt/topics';

const TICK_MS = 2500;

const DEFAULT_MACHINES = [
  { name: 'Mill Line A', type: 'Milling', location: 'Plant 1 · Bay 3' },
  { name: 'Roaster 2', type: 'Roasting', location: 'Plant 1 · Bay 5' },
  { name: 'Conveyor 7', type: 'Conveying', location: 'Plant 2 · Line B' },
  { name: 'Extruder 3', type: 'Extrusion', location: 'Plant 2 · Line C' },
  { name: 'Sorter 5', type: 'Optical Sorting', location: 'Plant 1 · Bay 1' },
  { name: 'Packer 9', type: 'Packing', location: 'Plant 3 · Dock 2' },
];

type Status = 'running' | 'idle' | 'fault' | 'off';

interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  temperature: number;
  vibration: number;
  throughput: number;
  energyUsage: number;
  pressure: number;
  status: Status;
  uptime: number;
  oeeScore: number;
  power: 'on' | 'off';
  locked: boolean; // suppress the random status roll (during restart/power changes)
  maxTemperature: number;
  maxVibration: number;
}

const devices = new Map<string, Device>();
let bus: MqttClient | null = null;

function walk(value: number, step: number, min: number, max: number): number {
  const next = value + (Math.random() * 2 - 1) * step;
  return Math.min(max, Math.max(min, Math.round(next * 10) / 10));
}

async function ensureMachines(): Promise<IMachine[]> {
  const count = await Machine.countDocuments();
  if (count === 0) {
    await Machine.insertMany(
      DEFAULT_MACHINES.map((m, i) => ({ ...m, gatewayId: `GW-${1000 + i}`, online: true, healthScore: 100 })),
    );
  }
  return Machine.find().sort({ createdAt: 1 });
}

function publishStatus(d: Device): void {
  const msg: StatusMessage = { machineId: d.id, status: d.status, ts: Date.now() };
  bus?.publish(topics.status(d.id), JSON.stringify(msg), { qos: 1, retain: true });
}

function publishTelemetry(d: Device): void {
  const msg: TelemetryMessage = {
    machineId: d.id, ts: Date.now(), name: d.name, type: d.type, location: d.location, status: d.status,
    temperature: d.temperature, vibration: d.vibration, throughput: d.throughput,
    energyUsage: d.energyUsage, pressure: d.pressure, uptime: d.uptime, oeeScore: d.oeeScore,
  };
  bus?.publish(topics.telemetry(d.id), JSON.stringify(msg), { qos: 0 });
}

function tick(): void {
  for (const d of devices.values()) {
    if (d.power === 'off') continue; // an off machine emits nothing

    const prevStatus = d.status;
    if (!d.locked) {
      const roll = Math.random();
      if (d.status === 'fault') d.status = roll < 0.4 ? 'running' : 'fault';
      else if (roll < 0.03) d.status = 'fault';
      else if (roll < 0.06) d.status = 'idle';
      else d.status = 'running';
    }

    if (d.status === 'running') {
      d.temperature = walk(d.temperature, 3, 45, 98);
      d.vibration = walk(d.vibration, 0.8, 0.5, 9);
      d.throughput = walk(d.throughput, 1.5, 4, 40);
      d.energyUsage = walk(d.energyUsage, 6, 40, 260);
      d.pressure = walk(d.pressure, 0.3, 1, 8);
      d.oeeScore = walk(d.oeeScore, 2, 55, 96);
    } else if (d.status === 'idle') {
      d.throughput = walk(d.throughput, 2, 0, 6);
      d.temperature = walk(d.temperature, 2, 40, 70);
      d.vibration = walk(d.vibration, 0.4, 0.2, 2);
    } else if (d.status === 'fault') {
      d.throughput = walk(d.throughput, 1, 0, 3);
      d.temperature = walk(d.temperature, 4, 80, 110);
      d.vibration = walk(d.vibration, 1, 6, 14);
    }
    d.uptime = walk(d.uptime, 0.3, 82, 100);

    publishTelemetry(d);
    if (d.status !== prevStatus) publishStatus(d);
  }
}

function ack(d: Device, commandId: string, message: string, status: 'ok' | 'error' = 'ok'): void {
  const msg: AckMessage = { commandId, status, message, ackAt: new Date().toISOString(), machineState: { status: d.status } };
  bus?.publish(topics.ack(d.id), JSON.stringify(msg), { qos: 1 });
}

function handleCommand(machineId: string, cmd: CommandMessage): void {
  const d = devices.get(machineId);
  if (!d) return;
  switch (cmd.command) {
    case 'power_on':
      d.power = 'on'; d.status = 'running'; d.locked = false;
      publishStatus(d); ack(d, cmd.commandId, 'Machine powered on');
      break;
    case 'power_off':
      d.power = 'off'; d.status = 'off'; d.locked = true;
      publishStatus(d); ack(d, cmd.commandId, 'Machine powered off successfully');
      break;
    case 'restart':
      d.power = 'on'; d.locked = true; d.status = 'idle'; publishStatus(d);
      ack(d, cmd.commandId, 'Restart sequence started');
      setTimeout(() => { d.status = 'running'; d.locked = false; publishStatus(d); }, 3000);
      break;
    case 'set_param': {
      const key = String(cmd.payload?.key ?? '');
      const value = Number(cmd.payload?.value);
      if (key === 'maxTemperature' && Number.isFinite(value)) d.maxTemperature = value;
      else if (key === 'maxVibration' && Number.isFinite(value)) d.maxVibration = value;
      ack(d, cmd.commandId, `Parameter ${key} set to ${value}`);
      break;
    }
    case 'clear_alerts':
      if (d.status === 'fault') { d.status = 'running'; publishStatus(d); }
      ack(d, cmd.commandId, 'Alerts cleared / fault acknowledged');
      break;
    default:
      ack(d, cmd.commandId, `Unsupported command: ${cmd.command}`, 'error');
  }
}

/** Boots the machine registry + starts each device publishing over MQTT. */
export async function startSimulator(url: string): Promise<void> {
  const machines = await ensureMachines();
  devices.clear();
  for (const m of machines) {
    devices.set(String(m._id), {
      id: String(m._id), name: m.name, type: m.type, location: m.location,
      temperature: 60 + Math.random() * 10, vibration: 1.5 + Math.random() * 2,
      throughput: 20 + Math.random() * 10, energyUsage: 120 + Math.random() * 40,
      pressure: 3 + Math.random() * 2, status: 'running', uptime: 95 + Math.random() * 4,
      oeeScore: 78 + Math.random() * 10, power: 'on', locked: false,
      maxTemperature: 92, maxVibration: 8,
    });
  }

  bus = connectBus('devices', url);
  bus.on('connect', () => {
    bus!.subscribe([topics.allCommands, topics.allTargetedAlerts, topics.broadcastAlerts], { qos: 1 });
    for (const d of devices.values()) publishStatus(d); // initial retained status
    console.log(`[simulator] ${devices.size} devices online over MQTT`);
  });

  bus.on('message', (topic, buf) => {
    if (topic.endsWith('/commands')) {
      const id = machineIdFromTopic(topic);
      if (id) handleCommand(id, JSON.parse(buf.toString()) as CommandMessage);
    }
    // Targeted/broadcast alerts are informational for the device; the cloud
    // persists + fans them out to the UI, so no device ack is required.
  });

  setInterval(tick, TICK_MS);
  console.log(`[simulator] streaming ${devices.size} machines every ${TICK_MS}ms via MQTT`);
}
