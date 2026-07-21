import { Alert } from '../models/Alert';
import { Machine, IMachine } from '../models/Machine';
import { broadcast } from '../sockets/io';

const TICK_MS = 2500;

const DEFAULT_MACHINES = [
  { name: 'Mill Line A', type: 'Milling', location: 'Plant 1 · Bay 3' },
  { name: 'Roaster 2', type: 'Roasting', location: 'Plant 1 · Bay 5' },
  { name: 'Conveyor 7', type: 'Conveying', location: 'Plant 2 · Line B' },
  { name: 'Extruder 3', type: 'Extrusion', location: 'Plant 2 · Line C' },
  { name: 'Sorter 5', type: 'Optical Sorting', location: 'Plant 1 · Bay 1' },
  { name: 'Packer 9', type: 'Packing', location: 'Plant 3 · Dock 2' },
];

type Status = 'running' | 'idle' | 'fault';

interface SimState {
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
}

const sim: SimState[] = [];
// Active alert id per `${machineId}:${metric}` so we don't spam duplicates.
const activeAlerts = new Map<string, string>();

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

async function openAlert(state: SimState, metric: string, severity: 'warning' | 'critical', message: string) {
  const key = `${state.id}:${metric}`;
  if (activeAlerts.has(key)) return;
  const alert = await Alert.create({
    machineId: state.id,
    machineName: state.name,
    metric,
    severity,
    message,
    status: 'active',
  });
  activeAlerts.set(key, String(alert._id));
  broadcast('alert:new', alert.toJSON());
}

async function clearAlert(state: SimState, metric: string) {
  const key = `${state.id}:${metric}`;
  const id = activeAlerts.get(key);
  if (!id) return;
  activeAlerts.delete(key);
  const alert = await Alert.findById(id);
  if (alert && alert.status !== 'resolved') {
    alert.status = 'resolved';
    await alert.save();
    broadcast('alert:cleared', { id, machineId: state.id });
  }
}

async function tick(): Promise<void> {
  for (const s of sim) {
    // Occasionally flip status; mostly running.
    const roll = Math.random();
    if (s.status === 'fault') {
      if (roll < 0.4) s.status = 'running'; // recover
    } else if (roll < 0.03) {
      s.status = 'fault';
    } else if (roll < 0.06) {
      s.status = 'idle';
    } else {
      s.status = 'running';
    }

    if (s.status === 'running') {
      s.temperature = walk(s.temperature, 3, 45, 98);
      s.vibration = walk(s.vibration, 0.8, 0.5, 9);
      s.throughput = walk(s.throughput, 1.5, 4, 40);
      s.energyUsage = walk(s.energyUsage, 6, 40, 260);
      s.pressure = walk(s.pressure, 0.3, 1, 8);
      s.oeeScore = walk(s.oeeScore, 2, 55, 96);
    } else if (s.status === 'idle') {
      s.throughput = walk(s.throughput, 2, 0, 6);
      s.temperature = walk(s.temperature, 2, 40, 70);
      s.vibration = walk(s.vibration, 0.4, 0.2, 2);
    } else {
      // fault: throughput collapses, temp/vibration spike
      s.throughput = walk(s.throughput, 1, 0, 3);
      s.temperature = walk(s.temperature, 4, 80, 110);
      s.vibration = walk(s.vibration, 1, 6, 14);
    }
    s.uptime = walk(s.uptime, 0.3, 82, 100);

    // Alert rules (open/clear so the list stays bounded).
    if (s.status === 'fault') {
      await openAlert(s, 'status', 'critical', `${s.name} reported a FAULT state`);
    } else {
      await clearAlert(s, 'status');
    }
    if (s.temperature > 92) {
      await openAlert(s, 'temperature', 'critical', `${s.name} temperature high (${s.temperature}°C)`);
    } else if (s.temperature < 88) {
      await clearAlert(s, 'temperature');
    }
    if (s.vibration > 8) {
      await openAlert(s, 'vibration', 'warning', `${s.name} vibration spike (${s.vibration} mm/s)`);
    } else if (s.vibration < 6.5) {
      await clearAlert(s, 'vibration');
    }
  }

  broadcast('iot:update', { ts: Date.now(), machines: sim });
}

/** Boots the machine registry + starts the live data stream. */
export async function startSimulator(): Promise<void> {
  const machines = await ensureMachines();
  sim.length = 0;
  for (const m of machines) {
    sim.push({
      id: String(m._id),
      name: m.name,
      type: m.type,
      location: m.location,
      temperature: 60 + Math.random() * 10,
      vibration: 1.5 + Math.random() * 2,
      throughput: 20 + Math.random() * 10,
      energyUsage: 120 + Math.random() * 40,
      pressure: 3 + Math.random() * 2,
      status: 'running',
      uptime: 95 + Math.random() * 4,
      oeeScore: 78 + Math.random() * 10,
    });
  }
  setInterval(() => {
    void tick();
  }, TICK_MS);
  console.log(`[simulator] streaming ${sim.length} machines every ${TICK_MS}ms`);
}
