import { Router } from 'express';
import { z } from 'zod';
import { ALL_PERMISSIONS, User } from '../models/User';
import { protect, requirePermission } from '../middleware/auth';
import { broadcast } from '../sockets/io';

const router = Router();
router.use(protect);

// User & permission management — gated on canManageUsers (admins bypass).
router.get('/', requirePermission('canManageUsers'), async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ success: true, data: users });
});

const updateSchema = z.object({
  active: z.boolean().optional(),
  permissions: z.array(z.enum([...ALL_PERMISSIONS] as [string, ...string[]])).optional(),
});

router.patch('/:id', requirePermission('canManageUsers'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid user payload' });
    return;
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  const permsChanged = parsed.data.permissions !== undefined;
  if (parsed.data.active !== undefined) user.active = parsed.data.active;
  if (parsed.data.permissions !== undefined) user.permissions = parsed.data.permissions as never;
  await user.save();
  // permission:changed lets that user's client refresh its granted abilities live.
  broadcast(permsChanged ? 'permission:changed' : 'user:changed', user.toJSON());
  res.json({ success: true, data: user });
});

export default router;
