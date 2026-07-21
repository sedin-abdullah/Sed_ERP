import { Router } from 'express';
import authRoutes from './auth.routes';
import iotRoutes from './iot.routes';
import technicianRoutes from './technician.routes';
import serviceRequestRoutes from './serviceRequest.routes';
import jobRoutes from './job.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/iot', iotRoutes);
router.use('/technicians', technicianRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/jobs', jobRoutes);
router.use('/users', userRoutes);

export default router;
