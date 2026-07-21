import { Router } from 'express';
import authRoutes from './auth.routes';
import iotRoutes from './iot.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/iot', iotRoutes);

// Phase 3+ mounts: /categories, /service-requests, /jobs, …

export default router;
