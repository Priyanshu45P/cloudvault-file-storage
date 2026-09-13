import { Permission } from '@prisma/client';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { driveService } from '../services/drive.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const userId = (req: AuthenticatedRequest) => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.userId;
};

const permissionOf = (value: unknown) => value === 'EDITOR' ? Permission.EDITOR : Permission.VIEWER;

const sendData = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });

export const driveController = {
  list: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.list(userId(req), { folderId: req.query.folderId as string | undefined, q: req.query.q as string | undefined, sort: req.query.sort as string | undefined, order: req.query.order as string | undefined }))),
  search: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.search(userId(req), String(req.query.q ?? '')))),
  upload: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.upload(userId(req), Array.isArray(req.files) ? req.files : [], typeof req.body.folderId === 'string' ? req.body.folderId : undefined), 201)),
  createFolder: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.createFolder(userId(req), String(req.body.name ?? ''), typeof req.body.parentFolderId === 'string' ? req.body.parentFolderId : undefined), 201)),
  renameFile: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.renameFile(userId(req), req.params.id, String(req.body.name ?? '')))),
  renameFolder: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.renameFolder(userId(req), req.params.id, String(req.body.name ?? '')))),
  moveFile: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.moveFile(userId(req), req.params.id, req.body.folderId || null))),
  moveFolder: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.moveFolder(userId(req), req.params.id, req.body.parentFolderId || null))),
  starFile: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.toggleFileStar(userId(req), req.params.id))),
  starFolder: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.toggleFolderStar(userId(req), req.params.id))),
  trashFile: asyncHandler(async (req: AuthenticatedRequest, res) => { await driveService.trashFile(userId(req), req.params.id); sendData(res, { deleted: true }); }),
  trashFolder: asyncHandler(async (req: AuthenticatedRequest, res) => { await driveService.trashFolder(userId(req), req.params.id); sendData(res, { deleted: true }); }),
  restoreFile: asyncHandler(async (req: AuthenticatedRequest, res) => { await driveService.restoreFile(userId(req), req.params.id); sendData(res, { restored: true }); }),
  restoreFolder: asyncHandler(async (req: AuthenticatedRequest, res) => { await driveService.restoreFolder(userId(req), req.params.id); sendData(res, { restored: true }); }),
  deleteFile: asyncHandler(async (req: AuthenticatedRequest, res) => { await driveService.permanentDeleteFile(userId(req), req.params.id); sendData(res, { deleted: true }); }),
  deleteFolder: asyncHandler(async (req: AuthenticatedRequest, res) => { await driveService.permanentDeleteFolder(userId(req), req.params.id); sendData(res, { deleted: true }); }),
  trash: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.trash(userId(req)))),
  emptyTrash: asyncHandler(async (req: AuthenticatedRequest, res) => { await driveService.emptyTrash(userId(req)); sendData(res, { emptied: true }); }),
  starred: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.starred(userId(req)))),
  recent: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.recent(userId(req)))),
  folderOptions: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.folderOptions(userId(req)))),
  shared: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.sharedWithMe(userId(req)))),
  sharedFolder: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.listSharedFolder(userId(req), req.params.id))),
  shareFile: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.shareFile(userId(req), req.params.id, String(req.body.email ?? ''), permissionOf(req.body.permission)), 201)),
  shareFolder: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.shareFolder(userId(req), req.params.id, String(req.body.email ?? ''), permissionOf(req.body.permission)), 201)),
  shareLinkFile: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.createShareLink(userId(req), 'file', req.params.id, permissionOf(req.body.permission), Number(req.body.expiresInDays) || undefined), 201)),
  shareLinkFolder: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.createShareLink(userId(req), 'folder', req.params.id, permissionOf(req.body.permission), Number(req.body.expiresInDays) || undefined), 201)),
  storage: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.storageStats(userId(req)))),
  activity: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.activity(userId(req), Number(req.query.limit) || 50))),
  versions: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.versions(userId(req), req.params.id))),
  uploadVersion: asyncHandler(async (req: AuthenticatedRequest, res) => {
    const file = Array.isArray(req.files) ? req.files[0] : undefined;
    sendData(res, await driveService.uploadVersion(userId(req), req.params.id, file), 201);
  }),
  restoreVersion: asyncHandler(async (req: AuthenticatedRequest, res) => sendData(res, await driveService.restoreVersion(userId(req), req.params.id, req.params.versionId))),
  downloadVersion: asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { version, data } = await driveService.readVersion(userId(req), req.params.id, req.params.versionId);
    res.setHeader('Content-Type', version.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(version.originalName)}`);
    res.send(data);
  }),
  preview: asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { file, data } = await driveService.readFile(userId(req), req.params.id, 'preview');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.send(data);
  }),
  download: asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { file, data } = await driveService.readFile(userId(req), req.params.id, 'download');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.send(data);
  }),
  publicInfo: asyncHandler(async (req, res) => sendData(res, await driveService.resolvePublic(req.params.token))),
  publicFolder: asyncHandler(async (req, res) => sendData(res, await driveService.publicFolder(req.params.token, typeof req.query.folderId === 'string' ? req.query.folderId : undefined))),
  publicFolderDownload: asyncHandler(async (req, res) => {
    const { file, data } = await driveService.readPublicFolderFile(req.params.token, req.params.fileId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.send(data);
  }),
  publicFolderPreview: asyncHandler(async (req, res) => {
    const { file, data } = await driveService.readPublicFolderFile(req.params.token, req.params.fileId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.send(data);
  }),
  publicDownload: asyncHandler(async (req, res) => {
    const { file, data } = await driveService.readPublic(req.params.token);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.send(data);
  }),
  publicPreview: asyncHandler(async (req, res) => {
    const { file, data } = await driveService.readPublic(req.params.token);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    res.send(data);
  }),
};
