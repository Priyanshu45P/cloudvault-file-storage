import { Router } from 'express';
import authRoutes from './auth.routes';
import driveRoutes from './drive.routes';
import publicRoutes from './public.routes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/', driveRoutes);
export default router;
