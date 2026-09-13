import { Router } from 'express';
import { driveController } from '../controllers/drive.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadFiles } from '../middleware/upload.middleware';

const router = Router();
router.use(requireAuth);

router.get('/drive', driveController.list);
router.get('/search', driveController.search);
router.post('/files/upload', uploadFiles.array('files', 20), driveController.upload);
router.get('/files/:id/versions', driveController.versions);
router.post('/files/:id/versions', uploadFiles.array('files', 1), driveController.uploadVersion);
router.post('/files/:id/versions/:versionId/restore', driveController.restoreVersion);
router.get('/files/:id/versions/:versionId/download', driveController.downloadVersion);
router.get('/files/:id/preview', driveController.preview);
router.get('/files/:id/download', driveController.download);
router.patch('/files/:id/rename', driveController.renameFile);
router.patch('/files/:id/move', driveController.moveFile);
router.patch('/files/:id/star', driveController.starFile);
router.delete('/files/:id', driveController.trashFile);
router.post('/files/:id/restore', driveController.restoreFile);
router.delete('/files/:id/permanent', driveController.deleteFile);
router.post('/files/:id/share', driveController.shareFile);
router.post('/files/:id/share-link', driveController.shareLinkFile);

router.post('/folders', driveController.createFolder);
router.get('/folders/options', driveController.folderOptions);
router.patch('/folders/:id/rename', driveController.renameFolder);
router.patch('/folders/:id/move', driveController.moveFolder);
router.patch('/folders/:id/star', driveController.starFolder);
router.delete('/folders/:id', driveController.trashFolder);
router.post('/folders/:id/restore', driveController.restoreFolder);
router.delete('/folders/:id/permanent', driveController.deleteFolder);
router.post('/folders/:id/share', driveController.shareFolder);
router.post('/folders/:id/share-link', driveController.shareLinkFolder);

router.get('/recent', driveController.recent);
router.get('/starred', driveController.starred);
router.get('/trash', driveController.trash);
router.delete('/trash', driveController.emptyTrash);
router.get('/shared', driveController.shared);
router.get('/shared/folder/:id', driveController.sharedFolder);
router.get('/storage/stats', driveController.storage);
router.get('/activity', driveController.activity);

export default router;
