import { Router } from 'express';
import { driveController } from '../controllers/drive.controller';

const router = Router();
router.get('/:token', driveController.publicInfo);
router.get('/:token/folder', driveController.publicFolder);
router.get('/:token/file/:fileId/download', driveController.publicFolderDownload);
router.get('/:token/file/:fileId/preview', driveController.publicFolderPreview);
router.get('/:token/download', driveController.publicDownload);
router.get('/:token/preview', driveController.publicPreview);
export default router;
