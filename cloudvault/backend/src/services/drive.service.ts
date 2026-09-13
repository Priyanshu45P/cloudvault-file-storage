import path from 'path';
import { ActivityAction, Permission, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { storageProvider } from '../storage';
import { ApiError } from '../utils/ApiError';
import { generateStorageKey, sanitizeFileName } from '../utils/filename';
import { categoryForMime, serializeFile, serializeFolder, splitName } from '../utils/drive';
import { v4 as uuid } from 'uuid';

const ownerSelect = { id: true, fullName: true, email: true } as const;

const serializeVersion = (version: any) => ({ ...version, size: version.size.toString() });

const assertOwnedFolder = async (folderId: string, userId: string) => {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, ownerId: userId, isDeleted: false } });
  if (!folder) throw ApiError.notFound('Folder not found');
  return folder;
};

const assertOwnedFile = async (fileId: string, userId: string, includeDeleted = false) => {
  const file = await prisma.file.findFirst({ where: { id: fileId, ownerId: userId, ...(includeDeleted ? {} : { isDeleted: false }) } });
  if (!file) throw ApiError.notFound('File not found');
  return file;
};

const hasFolderShareAccess = async (folderId: string | null, userId: string) => {
  let current = folderId;
  let guard = 0;
  while (current && guard < 50) {
    const share = await prisma.sharedItem.findFirst({ where: { folderId: current, sharedWithId: userId } });
    if (share) return share.permission;
    const folder = await prisma.folder.findUnique({ where: { id: current }, select: { parentFolderId: true } });
    current = folder?.parentFolderId ?? null;
    guard += 1;
  }
  return null;
};

const assertReadableFile = async (fileId: string, userId: string) => {
  const file = await prisma.file.findFirst({
    where: { id: fileId, isDeleted: false },
    include: { owner: { select: ownerSelect }, sharedItems: { where: { sharedWithId: userId }, take: 1 } },
  });
  if (!file) throw ApiError.notFound('File not found or access denied');
  if (file.ownerId !== userId && file.sharedItems.length === 0) {
    const inherited = await hasFolderShareAccess(file.folderId, userId);
    if (!inherited) throw ApiError.notFound('File not found or access denied');
  }
  return file;
};

const createActivity = async (userId: string, action: ActivityAction, fileId?: string, folderId?: string, metadata?: Prisma.InputJsonValue) => {
  await prisma.activityLog.create({ data: { userId, action, fileId, folderId, metadata } });
};

const uniqueFileName = async (name: string, ownerId: string, folderId: string | null) => {
  const clean = sanitizeFileName(name);
  const existing = await prisma.file.findMany({
    where: { ownerId, folderId, isDeleted: false },
    select: { originalName: true },
  });
  const names = new Set(existing.map((f) => f.originalName.toLowerCase()));
  if (!names.has(clean.toLowerCase())) return clean;
  const { base, ext } = splitName(clean);
  let i = 1;
  while (names.has(`${base} (${i})${ext}`.toLowerCase())) i += 1;
  return `${base} (${i})${ext}`;
};

const uniqueFolderName = async (name: string, ownerId: string, parentFolderId: string | null, excludeId?: string) => {
  const clean = sanitizeFileName(name).slice(0, 120);
  const exists = await prisma.folder.findFirst({
    where: { ownerId, parentFolderId, isDeleted: false, name: { equals: clean, mode: 'insensitive' }, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (exists) throw ApiError.conflict(`A folder named "${clean}" already exists here`);
  return clean;
};

const collectFolderIds = async (folderId: string): Promise<string[]> => {
  const ids = [folderId];
  let frontier = [folderId];
  while (frontier.length) {
    const children = await prisma.folder.findMany({ where: { parentFolderId: { in: frontier } }, select: { id: true } });
    frontier = children.map((f) => f.id);
    ids.push(...frontier);
  }
  return ids;
};

const folderWithin = async (candidateId: string | null, rootId: string) => {
  let current = candidateId;
  let guard = 0;
  while (current && guard < 100) {
    if (current === rootId) return true;
    const folder = await prisma.folder.findUnique({ where: { id: current }, select: { parentFolderId: true } });
    current = folder?.parentFolderId ?? null;
    guard += 1;
  }
  return false;
};

const breadcrumbFor = async (folderId: string | null, userId: string) => {
  const crumbs: Array<{ id: string; name: string }> = [];
  let current = folderId;
  let guard = 0;
  while (current && guard < 50) {
    const folder = await prisma.folder.findFirst({ where: { id: current, ownerId: userId }, select: { id: true, name: true, parentFolderId: true } });
    if (!folder) break;
    crumbs.unshift({ id: folder.id, name: folder.name });
    current = folder.parentFolderId;
    guard += 1;
  }
  return crumbs;
};

export const driveService = {
  async list(userId: string, input: { folderId?: string; q?: string; sort?: string; order?: string }) {
    const folderId = input.folderId || null;
    if (folderId) await assertOwnedFolder(folderId, userId);
    const q = input.q?.trim();
    const direction = input.order === 'asc' ? ('asc' as const) : ('desc' as const);
    const sort = input.sort || 'updatedAt';
    const orderBy: any = sort === 'name' ? { originalName: direction } : sort === 'size' ? { size: direction } : { updatedAt: direction };
    const folderOrderBy: any = sort === 'name' ? { name: direction } : { updatedAt: direction };

    const [folders, files, breadcrumb] = await Promise.all([
      prisma.folder.findMany({
        where: { ownerId: userId, parentFolderId: folderId, isDeleted: false, ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
        include: { owner: { select: ownerSelect }, _count: { select: { children: true, files: true } } },
        orderBy: folderOrderBy,
      }),
      prisma.file.findMany({
        where: { ownerId: userId, folderId, isDeleted: false, ...(q ? { originalName: { contains: q, mode: 'insensitive' } } : {}) },
        include: { owner: { select: ownerSelect } },
        orderBy,
      }),
      breadcrumbFor(folderId, userId),
    ]);
    return { folders: folders.map(serializeFolder), files: files.map(serializeFile), breadcrumb };
  },

  async search(userId: string, q: string) {
    const query = q.trim();
    if (!query) return { folders: [], files: [] };
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({ where: { ownerId: userId, isDeleted: false, name: { contains: query, mode: 'insensitive' } }, include: { owner: { select: ownerSelect } }, orderBy: { updatedAt: 'desc' }, take: 100 }),
      prisma.file.findMany({ where: { ownerId: userId, isDeleted: false, originalName: { contains: query, mode: 'insensitive' } }, include: { owner: { select: ownerSelect } }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    ]);
    return { folders: folders.map(serializeFolder), files: files.map(serializeFile) };
  },

  async upload(userId: string, files: Express.Multer.File[], folderId?: string) {
    if (!files.length) throw ApiError.badRequest('Select at least one file to upload');
    const destination = folderId?.trim() || null;
    if (destination) await assertOwnedFolder(destination, userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storageUsed: true, storageLimit: true } });
    if (!user) throw ApiError.unauthorized();
    const total = files.reduce((sum, f) => sum + BigInt(f.size), 0n);
    if (user.storageUsed + total > user.storageLimit) throw ApiError.quotaExceeded();

    const saved: Array<{ key: string; record: any }> = [];
    try {
      for (const incoming of files) {
        const displayName = await uniqueFileName(incoming.originalname, userId, destination);
        const key = generateStorageKey(displayName);
        const storagePath = await storageProvider.save(key, incoming.buffer);
        saved.push({ key, record: {
          originalName: displayName,
          storedName: key,
          mimeType: incoming.mimetype || 'application/octet-stream',
          extension: path.extname(displayName).slice(1).toLowerCase(),
          size: BigInt(incoming.size), storageKey: key, storagePath, ownerId: userId, folderId: destination,
        } });
      }
      const created = await prisma.$transaction(async (tx) => {
        const fresh = await tx.user.findUnique({ where: { id: userId }, select: { storageUsed: true, storageLimit: true } });
        if (!fresh || fresh.storageUsed + total > fresh.storageLimit) throw ApiError.quotaExceeded();
        const rows = [];
        for (const item of saved) rows.push(await tx.file.create({ data: item.record, include: { owner: { select: ownerSelect } } }));
        await tx.user.update({ where: { id: userId }, data: { storageUsed: { increment: total } } });
        await tx.activityLog.createMany({ data: rows.map((r) => ({ userId, fileId: r.id, action: ActivityAction.UPLOAD, metadata: { name: r.originalName, size: r.size.toString() } })) });
        return rows;
      });
      return { files: created.map(serializeFile), uploadedCount: created.length };
    } catch (error) {
      await Promise.allSettled(saved.map((s) => storageProvider.delete(s.key)));
      throw error;
    }
  },

  async createFolder(userId: string, name: string, parentFolderId?: string) {
    const parent = parentFolderId?.trim() || null;
    if (parent) await assertOwnedFolder(parent, userId);
    const clean = await uniqueFolderName(name, userId, parent);
    const folder = await prisma.folder.create({ data: { name: clean, ownerId: userId, parentFolderId: parent }, include: { owner: { select: ownerSelect } } });
    await createActivity(userId, ActivityAction.CREATE_FOLDER, undefined, folder.id, { name: clean });
    return serializeFolder(folder);
  },

  async renameFile(userId: string, fileId: string, name: string) {
    const file = await assertOwnedFile(fileId, userId);
    const clean = await uniqueFileName(name, userId, file.folderId);
    const updated = await prisma.file.update({ where: { id: fileId }, data: { originalName: clean, extension: path.extname(clean).slice(1).toLowerCase() }, include: { owner: { select: ownerSelect } } });
    await createActivity(userId, ActivityAction.RENAME, fileId, undefined, { from: file.originalName, to: clean });
    return serializeFile(updated);
  },

  async renameFolder(userId: string, folderId: string, name: string) {
    const folder = await assertOwnedFolder(folderId, userId);
    const clean = await uniqueFolderName(name, userId, folder.parentFolderId, folder.id);
    const updated = await prisma.folder.update({ where: { id: folderId }, data: { name: clean }, include: { owner: { select: ownerSelect } } });
    await createActivity(userId, ActivityAction.RENAME, undefined, folderId, { from: folder.name, to: clean });
    return serializeFolder(updated);
  },

  async moveFile(userId: string, fileId: string, folderId: string | null) {
    const file = await assertOwnedFile(fileId, userId);
    if (folderId) await assertOwnedFolder(folderId, userId);
    const updated = await prisma.file.update({ where: { id: fileId }, data: { folderId }, include: { owner: { select: ownerSelect } } });
    await createActivity(userId, ActivityAction.MOVE, fileId, undefined, { from: file.folderId, to: folderId });
    return serializeFile(updated);
  },

  async moveFolder(userId: string, folderId: string, parentFolderId: string | null) {
    const folder = await assertOwnedFolder(folderId, userId);
    if (parentFolderId === folderId) throw ApiError.badRequest('A folder cannot be moved into itself');
    if (parentFolderId) {
      await assertOwnedFolder(parentFolderId, userId);
      const descendants = await collectFolderIds(folderId);
      if (descendants.includes(parentFolderId)) throw ApiError.badRequest('A folder cannot be moved into one of its subfolders');
    }
    await uniqueFolderName(folder.name, userId, parentFolderId, folderId);
    const updated = await prisma.folder.update({ where: { id: folderId }, data: { parentFolderId }, include: { owner: { select: ownerSelect } } });
    await createActivity(userId, ActivityAction.MOVE, undefined, folderId, { from: folder.parentFolderId, to: parentFolderId });
    return serializeFolder(updated);
  },

  async toggleFileStar(userId: string, fileId: string) {
    const file = await assertOwnedFile(fileId, userId);
    const value = !file.isStarred;
    const updated = await prisma.file.update({ where: { id: fileId }, data: { isStarred: value }, include: { owner: { select: ownerSelect } } });
    await createActivity(userId, value ? ActivityAction.STAR : ActivityAction.UNSTAR, fileId);
    return serializeFile(updated);
  },

  async toggleFolderStar(userId: string, folderId: string) {
    const folder = await assertOwnedFolder(folderId, userId);
    const value = !folder.isStarred;
    const updated = await prisma.folder.update({ where: { id: folderId }, data: { isStarred: value }, include: { owner: { select: ownerSelect } } });
    await createActivity(userId, value ? ActivityAction.STAR : ActivityAction.UNSTAR, undefined, folderId);
    return serializeFolder(updated);
  },

  async trashFile(userId: string, fileId: string) {
    await assertOwnedFile(fileId, userId);
    await prisma.file.update({ where: { id: fileId }, data: { isDeleted: true, deletedAt: new Date() } });
    await createActivity(userId, ActivityAction.TRASH, fileId);
  },

  async trashFolder(userId: string, folderId: string) {
    await assertOwnedFolder(folderId, userId);
    const ids = await collectFolderIds(folderId);
    const now = new Date();
    await prisma.$transaction([
      prisma.folder.updateMany({ where: { id: { in: ids }, ownerId: userId }, data: { isDeleted: true, deletedAt: now } }),
      prisma.file.updateMany({ where: { folderId: { in: ids }, ownerId: userId }, data: { isDeleted: true, deletedAt: now } }),
    ]);
    await createActivity(userId, ActivityAction.TRASH, undefined, folderId);
  },

  async restoreFile(userId: string, fileId: string) {
    const file = await assertOwnedFile(fileId, userId, true);
    if (!file.isDeleted) return;
    await prisma.file.update({ where: { id: fileId }, data: { isDeleted: false, deletedAt: null } });
    await createActivity(userId, ActivityAction.RESTORE, fileId);
  },

  async restoreFolder(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, ownerId: userId } });
    if (!folder) throw ApiError.notFound('Folder not found');
    const ids = await collectFolderIds(folderId);
    await prisma.$transaction([
      prisma.folder.updateMany({ where: { id: { in: ids }, ownerId: userId }, data: { isDeleted: false, deletedAt: null } }),
      prisma.file.updateMany({ where: { folderId: { in: ids }, ownerId: userId }, data: { isDeleted: false, deletedAt: null } }),
    ]);
    await createActivity(userId, ActivityAction.RESTORE, undefined, folderId);
  },

  async permanentDeleteFile(userId: string, fileId: string) {
    const file = await assertOwnedFile(fileId, userId, true);
    const versions = await prisma.fileVersion.findMany({ where: { fileId } });
    await Promise.allSettled([storageProvider.delete(file.storageKey), ...versions.map((v) => storageProvider.delete(v.storageKey))]);
    const total = file.size + versions.reduce((sum, v) => sum + v.size, 0n);
    await prisma.$transaction([
      prisma.file.delete({ where: { id: fileId } }),
      prisma.user.update({ where: { id: userId }, data: { storageUsed: { decrement: total } } }),
    ]);
  },

  async permanentDeleteFolder(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, ownerId: userId } });
    if (!folder) throw ApiError.notFound('Folder not found');
    const ids = await collectFolderIds(folderId);
    const files = await prisma.file.findMany({ where: { ownerId: userId, folderId: { in: ids } } });
    const versions = await prisma.fileVersion.findMany({ where: { fileId: { in: files.map((f) => f.id) } } });
    await Promise.allSettled([...files.map((f) => storageProvider.delete(f.storageKey)), ...versions.map((v) => storageProvider.delete(v.storageKey))]);
    const total = files.reduce((sum, f) => sum + f.size, 0n) + versions.reduce((sum, v) => sum + v.size, 0n);
    await prisma.$transaction(async (tx) => {
      await tx.file.deleteMany({ where: { id: { in: files.map((f) => f.id) } } });
      await tx.folder.delete({ where: { id: folderId } });
      if (total > 0n) await tx.user.update({ where: { id: userId }, data: { storageUsed: { decrement: total } } });
    });
  },

  async trash(userId: string) {
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({ where: { ownerId: userId, isDeleted: true }, include: { owner: { select: ownerSelect } }, orderBy: { deletedAt: 'desc' } }),
      prisma.file.findMany({ where: { ownerId: userId, isDeleted: true }, include: { owner: { select: ownerSelect } }, orderBy: { deletedAt: 'desc' } }),
    ]);
    return { folders: folders.map(serializeFolder), files: files.map(serializeFile) };
  },

  async emptyTrash(userId: string) {
    const files = await prisma.file.findMany({ where: { ownerId: userId, isDeleted: true } });
    const versions = await prisma.fileVersion.findMany({ where: { fileId: { in: files.map((f) => f.id) } } });
    await Promise.allSettled([...files.map((f) => storageProvider.delete(f.storageKey)), ...versions.map((v) => storageProvider.delete(v.storageKey))]);
    const total = files.reduce((sum, f) => sum + f.size, 0n) + versions.reduce((sum, v) => sum + v.size, 0n);
    await prisma.$transaction(async (tx) => {
      await tx.file.deleteMany({ where: { ownerId: userId, isDeleted: true } });
      await tx.folder.deleteMany({ where: { ownerId: userId, isDeleted: true } });
      if (total > 0n) await tx.user.update({ where: { id: userId }, data: { storageUsed: { decrement: total } } });
    });
  },


  async starred(userId: string) {
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({ where: { ownerId: userId, isDeleted: false, isStarred: true }, include: { owner: { select: ownerSelect } }, orderBy: { updatedAt: 'desc' } }),
      prisma.file.findMany({ where: { ownerId: userId, isDeleted: false, isStarred: true }, include: { owner: { select: ownerSelect } }, orderBy: { updatedAt: 'desc' } }),
    ]);
    return { folders: folders.map(serializeFolder), files: files.map(serializeFile) };
  },

  async recent(userId: string) {
    const files = await prisma.file.findMany({ where: { ownerId: userId, isDeleted: false }, include: { owner: { select: ownerSelect } }, orderBy: [{ lastOpenedAt: 'desc' }, { updatedAt: 'desc' }], take: 100 });
    return { folders: [], files: files.map(serializeFile) };
  },

  async versions(userId: string, fileId: string) {
    const file = await assertReadableFile(fileId, userId);
    const versions = await prisma.fileVersion.findMany({ where: { fileId }, orderBy: { version: 'desc' } });
    return { current: serializeFile(file), versions: versions.map(serializeVersion), canEdit: file.ownerId === userId };
  },

  async uploadVersion(userId: string, fileId: string, incoming: Express.Multer.File | undefined) {
    const file = await assertOwnedFile(fileId, userId);
    if (!incoming) throw ApiError.badRequest('Choose a file for the new version');
    const incomingExtension = path.extname(incoming.originalname).slice(1).toLowerCase();
    if (incomingExtension !== file.extension.toLowerCase()) {
      throw ApiError.badRequest(`New versions must use the .${file.extension || 'same'} file type`);
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storageUsed: true, storageLimit: true } });
    if (!user || user.storageUsed + BigInt(incoming.size) > user.storageLimit) throw ApiError.quotaExceeded();
    const nextVersion = (await prisma.fileVersion.aggregate({ where: { fileId }, _max: { version: true } }))._max.version ?? 0;
    const versionNumber = nextVersion + 1;
    const newKey = generateStorageKey(file.originalName);
    let newPath: string | null = null;
    try {
      newPath = await storageProvider.save(newKey, incoming.buffer);
      const updated = await prisma.$transaction(async (tx) => {
        await tx.fileVersion.create({ data: {
          fileId, version: versionNumber, originalName: file.originalName, mimeType: file.mimeType,
          extension: file.extension, size: file.size, storageKey: file.storageKey, storagePath: file.storagePath,
        } });
        const row = await tx.file.update({ where: { id: fileId }, data: {
          storedName: newKey, mimeType: incoming.mimetype || file.mimeType, size: BigInt(incoming.size),
          storageKey: newKey, storagePath: newPath!, lastOpenedAt: new Date(),
        }, include: { owner: { select: ownerSelect } } });
        await tx.user.update({ where: { id: userId }, data: { storageUsed: { increment: BigInt(incoming.size) } } });
        await tx.activityLog.create({ data: { userId, fileId, action: ActivityAction.VERSION_UPLOAD, metadata: { version: versionNumber } } });
        return row;
      });
      return serializeFile(updated);
    } catch (error) {
      if (newPath) await storageProvider.delete(newKey).catch(() => undefined);
      throw error;
    }
  },

  async restoreVersion(userId: string, fileId: string, versionId: string) {
    const file = await assertOwnedFile(fileId, userId);
    const version = await prisma.fileVersion.findFirst({ where: { id: versionId, fileId } });
    if (!version) throw ApiError.notFound('Version not found');
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storageUsed: true, storageLimit: true } });
    if (!user || user.storageUsed + version.size > user.storageLimit) throw ApiError.quotaExceeded();
    const buffer = await storageProvider.read(version.storageKey);
    const newKey = generateStorageKey(file.originalName);
    let newPath: string | null = null;
    try {
      newPath = await storageProvider.save(newKey, buffer);
      const nextVersion = ((await prisma.fileVersion.aggregate({ where: { fileId }, _max: { version: true } }))._max.version ?? 0) + 1;
      const updated = await prisma.$transaction(async (tx) => {
        await tx.fileVersion.create({ data: {
          fileId, version: nextVersion, originalName: file.originalName, mimeType: file.mimeType,
          extension: file.extension, size: file.size, storageKey: file.storageKey, storagePath: file.storagePath,
        } });
        const row = await tx.file.update({ where: { id: fileId }, data: {
          storedName: newKey, mimeType: version.mimeType, extension: version.extension, size: version.size,
          storageKey: newKey, storagePath: newPath!, lastOpenedAt: new Date(),
        }, include: { owner: { select: ownerSelect } } });
        await tx.user.update({ where: { id: userId }, data: { storageUsed: { increment: version.size } } });
        await tx.activityLog.create({ data: { userId, fileId, action: ActivityAction.VERSION_RESTORE, metadata: { restoredVersion: version.version, archivedCurrentAs: nextVersion } } });
        return row;
      });
      return serializeFile(updated);
    } catch (error) {
      if (newPath) await storageProvider.delete(newKey).catch(() => undefined);
      throw error;
    }
  },

  async readVersion(userId: string, fileId: string, versionId: string) {
    await assertReadableFile(fileId, userId);
    const version = await prisma.fileVersion.findFirst({ where: { id: versionId, fileId } });
    if (!version) throw ApiError.notFound('Version not found');
    const data = await storageProvider.read(version.storageKey);
    return { version, data };
  },

  async readFile(userId: string, fileId: string, action: 'preview' | 'download') {
    const file = await assertReadableFile(fileId, userId);
    const exists = await storageProvider.exists(file.storageKey);
    if (!exists) throw new ApiError(404, 'STORAGE_ERROR', 'Stored file is missing');
    const data = await storageProvider.read(file.storageKey);
    await prisma.file.update({ where: { id: fileId }, data: { lastOpenedAt: new Date() } });
    await createActivity(userId, action === 'download' ? ActivityAction.DOWNLOAD : ActivityAction.OPEN, fileId);
    return { file, data };
  },

  async folderOptions(userId: string) {
    const folders = await prisma.folder.findMany({ where: { ownerId: userId, isDeleted: false }, select: { id: true, name: true, parentFolderId: true }, orderBy: { name: 'asc' } });
    return folders;
  },

  async shareFile(userId: string, fileId: string, email: string, permission: Permission) {
    await assertOwnedFile(fileId, userId);
    const recipient = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!recipient) throw ApiError.notFound('No CloudVault user exists with that email');
    if (recipient.id === userId) throw ApiError.badRequest('You already own this file');
    const existing = await prisma.sharedItem.findFirst({ where: { fileId, sharedWithId: recipient.id } });
    const share = existing
      ? await prisma.sharedItem.update({ where: { id: existing.id }, data: { permission }, include: { sharedWith: { select: ownerSelect } } })
      : await prisma.sharedItem.create({ data: { fileId, sharedById: userId, sharedWithId: recipient.id, permission }, include: { sharedWith: { select: ownerSelect } } });
    await createActivity(userId, ActivityAction.SHARE, fileId, undefined, { sharedWith: recipient.email, permission });
    return share;
  },

  async shareFolder(userId: string, folderId: string, email: string, permission: Permission) {
    await assertOwnedFolder(folderId, userId);
    const recipient = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!recipient) throw ApiError.notFound('No CloudVault user exists with that email');
    if (recipient.id === userId) throw ApiError.badRequest('You already own this folder');
    const existing = await prisma.sharedItem.findFirst({ where: { folderId, sharedWithId: recipient.id } });
    const share = existing
      ? await prisma.sharedItem.update({ where: { id: existing.id }, data: { permission }, include: { sharedWith: { select: ownerSelect } } })
      : await prisma.sharedItem.create({ data: { folderId, sharedById: userId, sharedWithId: recipient.id, permission }, include: { sharedWith: { select: ownerSelect } } });
    await createActivity(userId, ActivityAction.SHARE, undefined, folderId, { sharedWith: recipient.email, permission });
    return share;
  },

  async listSharedFolder(userId: string, folderId: string) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId }, include: { owner: { select: ownerSelect } } });
    if (!folder || folder.isDeleted) throw ApiError.notFound('Shared folder not found');
    if (folder.ownerId !== userId) {
      const permission = await hasFolderShareAccess(folderId, userId);
      if (!permission) throw ApiError.forbidden('This folder has not been shared with you');
    }
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({ where: { parentFolderId: folderId, isDeleted: false }, include: { owner: { select: ownerSelect } }, orderBy: { name: 'asc' } }),
      prisma.file.findMany({ where: { folderId, isDeleted: false }, include: { owner: { select: ownerSelect } }, orderBy: { originalName: 'asc' } }),
    ]);
    const breadcrumb: Array<{ id: string; name: string }> = [];
    let current: string | null = folderId;
    let guard = 0;
    while (current && guard < 50) {
      const row = await prisma.folder.findUnique({ where: { id: current }, select: { id: true, name: true, parentFolderId: true } });
      if (!row) break;
      breadcrumb.unshift({ id: row.id, name: row.name });
      if (await prisma.sharedItem.findFirst({ where: { folderId: row.id, sharedWithId: userId } })) break;
      current = row.parentFolderId;
      guard += 1;
    }
    return { folder: serializeFolder(folder), folders: folders.map(serializeFolder), files: files.map(serializeFile), breadcrumb };
  },

  async sharedWithMe(userId: string) {
    const shares = await prisma.sharedItem.findMany({
      where: { sharedWithId: userId },
      include: {
        file: { include: { owner: { select: ownerSelect } } },
        folder: { include: { owner: { select: ownerSelect } } },
        sharedBy: { select: ownerSelect },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      files: shares.filter((s) => s.file && !s.file.isDeleted).map((s) => ({ ...serializeFile(s.file), permission: s.permission, sharedBy: s.sharedBy })),
      folders: shares.filter((s) => s.folder && !s.folder.isDeleted).map((s) => ({ ...serializeFolder(s.folder), permission: s.permission, sharedBy: s.sharedBy })),
    };
  },

  async createShareLink(userId: string, type: 'file' | 'folder', id: string, permission: Permission, expiresInDays?: number) {
    if (type === 'file') await assertOwnedFile(id, userId); else await assertOwnedFolder(id, userId);
    const expiresAt = expiresInDays && expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 86400000) : null;
    const link = await prisma.shareLink.create({ data: { token: uuid().replace(/-/g, ''), fileId: type === 'file' ? id : null, folderId: type === 'folder' ? id : null, permission, expiresAt, createdById: userId } });
    return { ...link, urlPath: `/public/${link.token}` };
  },

  async resolvePublic(token: string) {
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: { file: { include: { owner: { select: ownerSelect } } }, folder: { include: { owner: { select: ownerSelect } } }, createdBy: { select: ownerSelect } },
    });
    if (!link || !link.isActive || (link.expiresAt && link.expiresAt < new Date())) throw ApiError.notFound('This share link is invalid or expired');
    if (link.file?.isDeleted || link.folder?.isDeleted) throw ApiError.notFound('This shared item is no longer available');
    return { link: { token: link.token, permission: link.permission, expiresAt: link.expiresAt }, file: link.file ? serializeFile(link.file) : null, folder: link.folder ? serializeFolder(link.folder) : null };
  },

  async publicFolder(token: string, requestedFolderId?: string) {
    const resolved = await this.resolvePublic(token);
    if (!resolved.folder) throw ApiError.badRequest('This public link points to a file');
    const rootId = resolved.folder.id;
    const folderId = requestedFolderId || rootId;
    if (!(await folderWithin(folderId, rootId))) throw ApiError.forbidden('This folder is outside the shared link');
    const folder = await prisma.folder.findFirst({ where: { id: folderId, isDeleted: false }, include: { owner: { select: ownerSelect } } });
    if (!folder) throw ApiError.notFound('Shared folder not found');
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({ where: { parentFolderId: folderId, isDeleted: false }, include: { owner: { select: ownerSelect } }, orderBy: { name: 'asc' } }),
      prisma.file.findMany({ where: { folderId, isDeleted: false }, include: { owner: { select: ownerSelect } }, orderBy: { originalName: 'asc' } }),
    ]);
    const breadcrumb: Array<{ id: string; name: string }> = [];
    let current: string | null = folderId;
    let guard = 0;
    while (current && guard < 100) {
      const row = await prisma.folder.findUnique({ where: { id: current }, select: { id: true, name: true, parentFolderId: true } });
      if (!row) break;
      breadcrumb.unshift({ id: row.id, name: row.name });
      if (row.id === rootId) break;
      current = row.parentFolderId;
      guard += 1;
    }
    return { folder: serializeFolder(folder), folders: folders.map(serializeFolder), files: files.map(serializeFile), breadcrumb };
  },

  async readPublicFolderFile(token: string, fileId: string) {
    const resolved = await this.resolvePublic(token);
    if (!resolved.folder) throw ApiError.badRequest('This public link points to a file');
    const file = await prisma.file.findFirst({ where: { id: fileId, isDeleted: false } });
    if (!file || !(await folderWithin(file.folderId, resolved.folder.id))) throw ApiError.notFound('File is not part of this shared folder');
    const data = await storageProvider.read(file.storageKey);
    return { file, data };
  },

  async readPublic(token: string) {
    const resolved = await this.resolvePublic(token);
    if (!resolved.file) throw ApiError.badRequest('This public link points to a folder');
    const raw = await prisma.file.findUnique({ where: { id: resolved.file.id } });
    if (!raw) throw ApiError.notFound('File not found');
    const data = await storageProvider.read(raw.storageKey);
    return { file: raw, data };
  },

  async storageStats(userId: string) {
    const [user, files, versions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { storageUsed: true, storageLimit: true } }),
      prisma.file.findMany({ where: { ownerId: userId, isDeleted: false }, select: { size: true, mimeType: true, extension: true } }),
      prisma.fileVersion.findMany({ where: { file: { ownerId: userId, isDeleted: false } }, select: { size: true, mimeType: true, extension: true } }),
    ]);
    if (!user) throw ApiError.notFound('User not found');
    const categories: Record<string, bigint> = { Images: 0n, Videos: 0n, Documents: 0n, Audio: 0n, Archives: 0n, Other: 0n };
    for (const f of [...files, ...versions]) categories[categoryForMime(f.mimeType, f.extension)] += f.size;
    return { storageUsed: user.storageUsed.toString(), storageLimit: user.storageLimit.toString(), categories: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, v.toString()])), fileCount: files.length };
  },

  async activity(userId: string, limit = 50) {
    return prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: Math.min(limit, 100), include: { file: { select: { id: true, originalName: true } }, folder: { select: { id: true, name: true } } } });
  },
};
