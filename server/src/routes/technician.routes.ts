import { Router } from 'express';
import { z } from 'zod';
import { Technician } from '../models/Technician';
import { protect, requirePermission } from '../middleware/auth';
import { broadcast } from '../sockets/io';

const router = Router();
router.use(protect);

// Listing technicians is available to any authenticated user (the request
// form and job board need it); mutations require canManageTechnicians.
router.get('/', async (_req, res) => {
  const technicians = await Technician.find().sort({ createdAt: 1 });
  res.json({ success: true, data: technicians });
});

const upsertSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
  region: z.string().min(1),
  status: z.enum(['available', 'busy', 'off']).optional(),
  active: z.boolean().optional(),
});

router.post('/', requirePermission('canManageTechnicians'), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid technician payload' });
    return;
  }
  const technician = await Technician.create({ ...parsed.data, skills: parsed.data.skills ?? [] });
  broadcast('technician:changed', technician.toJSON());
  res.status(201).json({ success: true, data: technician });
});

router.patch('/:id', requirePermission('canManageTechnicians'), async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid technician payload' });
    return;
  }
  const technician = await Technician.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!technician) {
    res.status(404).json({ success: false, message: 'Technician not found' });
    return;
  }
  broadcast('technician:changed', technician.toJSON());
  res.json({ success: true, data: technician });
});

router.delete('/:id', requirePermission('canManageTechnicians'), async (req, res) => {
  const technician = await Technician.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!technician) {
    res.status(404).json({ success: false, message: 'Technician not found' });
    return;
  }
  // Soft delete so existing jobs keep their technician reference.
  broadcast('technician:changed', technician.toJSON());
  res.json({ success: true, data: technician });
});

export default router;
