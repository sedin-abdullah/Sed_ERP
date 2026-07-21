import { Router } from 'express';
import { z } from 'zod';
import { Alert } from '../models/Alert';
import { Machine } from '../models/Machine';
import { protect } from '../middleware/auth';
import { broadcast } from '../sockets/io';

const router = Router();

router.use(protect);

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

export default router;
