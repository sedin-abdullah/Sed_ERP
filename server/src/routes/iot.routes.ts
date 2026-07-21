import { Router, Request } from 'express';
import { z } from 'zod';
import { Alert } from '../models/Alert';
import { Machine } from '../models/Machine';
import { MachineCommand } from '../models/MachineCommand';
import { Permission } from '../models/User';
import { protect } from '../middleware/auth';
import { broadcast } from '../sockets/io';
import { uuid } from '../mqtt/bus';
import { publishBroadcastAlert, publishCommand, publishTargetedAlert, setThreshold } from '../mqtt/cloud';
import type { CommandName } from '../mqtt/topics';

const router = Router();

router.use(protect);

/** Admin bypasses; otherwise the user needs at least one of the given perms. */
function hasPerm(req: Request, ...perms: Permission[]): boolean {
  const u = req.user!;
  return u.role === 'admin' || perms.some((p) => u.permissions.includes(p));
}

// --- Machines registry ---
router.get('/machines', async (_req, res) => {
  const machines = await Machine.find().sort({ createdAt: 1 });
  res.json({ success: true, data: machines });
});

// --- Alerts ---
router.get('/alerts', async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === 'string') filter.status = req.query.status;
  const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: alerts });
});

const statusSchema = z.object({ status: z.enum(['active', 'ack', 'resolved']) });

router.patch('/alerts/:id', async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid status' });
    return;
  }
  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    res.status(404).json({ success: false, message: 'Alert not found' });
    return;
  }
  alert.status = parsed.data.status;
  if (parsed.data.status === 'ack') alert.acknowledgedBy = req.user!._id as never;
  if (parsed.data.status === 'resolved') alert.resolvedBy = req.user!._id as never;
  await alert.save();
  // Broadcast so every open Alerts page updates instantly.
  broadcast(parsed.data.status === 'resolved' ? 'alert:cleared' : 'alert:new', alert.toJSON());
  res.json({ success: true, data: alert });
});

// --- Machine command history (audit trail) ---
router.get('/machines/:id/commands', async (req, res) => {
  const commands = await MachineCommand.find({ machineId: req.params.id }).sort({ issuedAt: -1 }).limit(50);
  res.json({ success: true, data: commands });
});

// --- Admin machine control: publish an MQTT command ---
const commandSchema = z.object({
  command: z.enum(['power_on', 'power_off', 'restart', 'set_param', 'clear_alerts']),
  payload: z.record(z.unknown()).optional(),
});

// Which permission(s) each command needs (admin always bypasses).
const POWER: CommandName[] = ['power_on', 'power_off', 'restart'];

router.post('/machines/:id/commands', async (req, res) => {
  const parsed = commandSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid command' });
    return;
  }
  const { command, payload } = parsed.data;
  const needsPower = POWER.includes(command);
  const allowed = needsPower
    ? hasPerm(req, 'canControlMachines', 'canPowerCycleMachines')
    : hasPerm(req, 'canControlMachines');
  if (!allowed) {
    res.status(403).json({ success: false, message: 'Missing machine-control permission' });
    return;
  }
  const machine = await Machine.findById(req.params.id);
  if (!machine) {
    res.status(404).json({ success: false, message: 'Machine not found' });
    return;
  }

  const commandId = uuid();
  const doc = await MachineCommand.create({
    machineId: machine._id, machineName: machine.name, command, payload,
    commandId, issuedBy: req.user!._id, issuedByName: req.user!.name, issuedAt: new Date(), ackStatus: 'pending',
  });
  broadcast('machine:command-ack', doc.toJSON()); // pending row appears immediately

  // Keep the cloud alert thresholds in step with a set_param command.
  if (command === 'set_param' && payload && typeof payload.key === 'string') {
    setThreshold(String(machine._id), payload.key, Number(payload.value));
  }

  publishCommand(String(machine._id), {
    commandId, command, payload: payload ?? {}, issuedBy: String(req.user!._id),
    issuedByName: req.user!.name, issuedAt: doc.issuedAt.toISOString(),
  });

  res.status(202).json({ success: true, data: doc });
});

// --- Admin: send a targeted alert to one machine ---
const alertSchema = z.object({
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string().min(1),
  autoDismissMs: z.number().optional(),
});

router.post('/machines/:id/alert', async (req, res) => {
  if (!hasPerm(req, 'canControlMachines', 'canSendMachineAlerts')) {
    res.status(403).json({ success: false, message: 'Missing send-alert permission' });
    return;
  }
  const parsed = alertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid alert' });
    return;
  }
  const machine = await Machine.findById(req.params.id);
  if (!machine) {
    res.status(404).json({ success: false, message: 'Machine not found' });
    return;
  }
  const alert = await Alert.create({
    machineId: machine._id, machineName: machine.name, metric: 'admin',
    severity: parsed.data.severity, message: parsed.data.message, status: 'active',
    source: 'admin', issuedBy: req.user!._id,
  });
  publishTargetedAlert(String(machine._id), {
    alertId: String(alert._id), machineId: String(machine._id), severity: parsed.data.severity,
    message: parsed.data.message, autoDismissMs: parsed.data.autoDismissMs, issuedByName: req.user!.name,
  });
  broadcast('alert:new', alert.toJSON());
  // Log to the command audit so it shows in the machine's history.
  await MachineCommand.create({
    machineId: machine._id, machineName: machine.name, command: 'alert', payload: parsed.data,
    commandId: uuid(), issuedBy: req.user!._id, issuedByName: req.user!.name, issuedAt: new Date(),
    ackStatus: 'ok', ackAt: new Date(), ackMessage: 'Alert dispatched',
  });
  res.status(201).json({ success: true, data: alert });
});

// --- Admin: broadcast an alert to ALL machines ---
router.post('/alerts/broadcast', async (req, res) => {
  if (!hasPerm(req, 'canControlMachines', 'canBroadcastAlerts')) {
    res.status(403).json({ success: false, message: 'Missing broadcast permission' });
    return;
  }
  const parsed = alertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid alert' });
    return;
  }
  const machines = await Machine.find();
  publishBroadcastAlert({
    machineId: '*', severity: parsed.data.severity, message: parsed.data.message,
    autoDismissMs: parsed.data.autoDismissMs, issuedByName: req.user!.name,
  });
  // Persist one alert per machine so every card reflects it live.
  const created = await Alert.insertMany(
    machines.map((m) => ({
      machineId: m._id, machineName: m.name, metric: 'admin', severity: parsed.data.severity,
      message: parsed.data.message, status: 'active', source: 'admin', issuedBy: req.user!._id,
    })),
  );
  created.forEach((a) => broadcast('alert:new', a.toJSON()));
  await MachineCommand.create({
    machineId: machines[0]?._id, machineName: 'ALL machines', command: 'broadcast_alert', payload: parsed.data,
    commandId: uuid(), issuedBy: req.user!._id, issuedByName: req.user!.name, issuedAt: new Date(),
    ackStatus: 'ok', ackAt: new Date(), ackMessage: `Broadcast to ${machines.length} machines`,
  });
  res.status(201).json({ success: true, data: { count: created.length } });
});

export default router;
