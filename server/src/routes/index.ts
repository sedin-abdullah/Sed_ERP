import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'ok' });
});

router.use('/auth', authRoutes);

// Phase 2+ mounts: /machines, /alerts, /categories, /service-requests, /jobs, …

export default router;
