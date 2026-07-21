import { Router } from 'express';
import { z } from 'zod';
import { ServiceRequest, REQUEST_CATEGORIES } from '../models/ServiceRequest';
import { Quote } from '../models/Quote';
import { Job } from '../models/Job';
import { Technician } from '../models/Technician';
import { protect, requirePermission } from '../middleware/auth';
import { broadcast } from '../sockets/io';
import { nextCode } from '../utils/code';

const router = Router();
router.use(protect);

/**
 * SedService request lifecycle:
 *   pending → quoted → approved → assigned → in_progress → completed
 *   (cancellable until completed)
 * Admin (Phase 4) drives quote/approve/assign; users (Phase 5) create
 * requests and accept quotes. Every mutation broadcasts so all consoles sync.
 */

// List — admins & canViewAllRequests see everything; others see their own.
router.get('/', async (req, res) => {
  const canViewAll = req.user!.role === 'admin' || req.user!.permissions.includes('canViewAllRequests');
  const filter = canViewAll ? {} : { requesterId: req.user!._id };
  const requests = await ServiceRequest.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: requests });
});

const createSchema = z.object({
  title: z.string().min(1),
  category: z.enum(REQUEST_CATEGORIES),
  description: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  machineName: z.string().optional(),
  location: z.string().min(1),
});

router.post('/', requirePermission('canRequestService'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid request payload' });
    return;
  }
  const code = await nextCode('SR', ServiceRequest);
  const request = await ServiceRequest.create({
    ...parsed.data,
    code,
    requesterId: req.user!._id,
    requesterName: req.user!.name,
    status: 'pending',
  });
  broadcast('service-request:changed', request.toJSON());
  res.status(201).json({ success: true, data: request });
});

// --- Admin: issue a quote ---
const quoteSchema = z.object({
  amount: z.number().nonnegative(),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

router.post('/:id/quote', requirePermission('canViewAllRequests'), async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid quote payload' });
    return;
  }
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  const quote = await Quote.create({
    requestId: request._id,
    amount: parsed.data.amount,
    notes: parsed.data.notes,
    validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
    createdBy: req.user!._id,
    status: 'sent',
  });
  request.quoteId = quote._id as never;
  request.status = 'quoted';
  await request.save();
  broadcast('quote:changed', quote.toJSON());
  broadcast('service-request:changed', request.toJSON());
  res.status(201).json({ success: true, data: { request, quote } });
});

// --- Admin: approve (skip the user acceptance step) ---
router.post('/:id/approve', requirePermission('canViewAllRequests'), async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  request.status = 'approved';
  await request.save();
  if (request.quoteId) await Quote.findByIdAndUpdate(request.quoteId, { status: 'accepted' });
  broadcast('service-request:changed', request.toJSON());
  res.json({ success: true, data: request });
});

// --- Admin: assign a technician → create a Job ---
const assignSchema = z.object({ technicianId: z.string().min(1), scheduledFor: z.string().optional() });

router.post('/:id/assign', requirePermission('canViewAllRequests'), async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'technicianId is required' });
    return;
  }
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  const technician = await Technician.findById(parsed.data.technicianId);
  if (!technician || !technician.active) {
    res.status(404).json({ success: false, message: 'Technician not found' });
    return;
  }
  const code = await nextCode('JOB', Job);
  const job = await Job.create({
    code,
    requestId: request._id,
    requestTitle: request.title,
    technicianId: technician._id,
    technicianName: technician.name,
    status: 'scheduled',
    scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
  });
  request.jobId = job._id as never;
  request.status = 'assigned';
  await request.save();
  technician.status = 'busy';
  await technician.save();
  broadcast('job:changed', job.toJSON());
  broadcast('service-request:changed', request.toJSON());
  broadcast('technician:changed', technician.toJSON());
  res.status(201).json({ success: true, data: { request, job } });
});

// --- Status transitions (admin advance / cancel) ---
const statusSchema = z.object({
  status: z.enum(['pending', 'quoted', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled']),
});

router.patch('/:id/status', async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid status' });
    return;
  }
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }
  const isOwner = String(request.requesterId) === String(req.user!._id);
  const canManage = req.user!.role === 'admin' || req.user!.permissions.includes('canViewAllRequests');
  // Owners may only cancel their own request; managers may set any status.
  if (!canManage && !(isOwner && parsed.data.status === 'cancelled')) {
    res.status(403).json({ success: false, message: 'Not allowed to change this request' });
    return;
  }
  request.status = parsed.data.status;
  await request.save();
  broadcast('service-request:changed', request.toJSON());
  res.json({ success: true, data: request });
});

// Quotes list (admin) — flat, for the console.
router.get('/quotes/all', requirePermission('canViewAllRequests'), async (_req, res) => {
  const quotes = await Quote.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: quotes });
});

export default router;
