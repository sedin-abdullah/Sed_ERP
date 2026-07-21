import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { protect } from '../middleware/auth';
import { signToken } from '../utils/token';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(parsed.data.password))) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }
  if (!user.active) {
    res.status(403).json({ success: false, message: 'Account disabled' });
    return;
  }
  const accessToken = signToken({ sub: String(user._id), role: user.role });
  res.json({ success: true, data: { user: user.toJSON(), accessToken } });
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: { user: req.user!.toJSON() } });
});

export default router;
