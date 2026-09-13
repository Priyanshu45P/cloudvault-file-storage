import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);

// Phase 2+ routers (files, folders, sharing, search, recent, starred, trash,
// storage, activities) are added here as they are built, e.g.:
// router.use('/files', fileRoutes);
// router.use('/folders', folderRoutes);

export default router;
