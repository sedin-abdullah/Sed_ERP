import { Router } from 'express';
import { z } from 'zod';
import { Job, JOB_STATUSES } from '../models/Job';
import { ServiceRequest } from '../models/ServiceRequest';
import { Technician } from '../models/Technician';
import { protect, requirePermission } from '../middleware/auth';
import { broadcast } from '../sockets/io';

const router = Router();
router.use(protect);

router.get('/', async (_req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: jobs });
});

const statusSchema = z.object({ status: z.enum(JOB_STATUSES as [string, ...string[]]) });

/**
 * Advance a job on the Kanban board. Side effects keep the request + technician
 * in sync: moving off 'scheduled' marks the request in_progress; 'completed'
 * closes the request, frees the technician and bumps their completed count.
 */
router.patch('/:id/status', requirePermission('canManageTechnicians'), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid status' });
    return;
  }
  const job = await Job.findById(req.params.id);
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }
  const status = parsed.data.status as (typeof JOB_STATUSES)[number];
  job.status = status;
  await job.save();
  broadcast('job:changed', job.toJSON());

  const request = await ServiceRequest.findById(job.requestId);
  if (request && request.status !== 'completed' && request.status !== 'cancelled') {
    request.status = status === 'completed' ? 'completed' : 'in_progress';
    await request.save();
    broadcast('service-request:changed', request.toJSON());
  }

  if (status === 'completed') {
    const technician = await Technician.findById(job.technicianId);
    if (technician) {
      technician.status = 'available';
      technician.completedJobs += 1;
      await technician.save();
      broadcast('technician:changed', technician.toJSON());
    }
  }

  res.json({ success: true, data: job });
});

export default router;
