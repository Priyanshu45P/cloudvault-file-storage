import path from 'path';
import { v4 as uuid } from 'uuid';

/** Strips path separators and control characters so a display name is safe to store/render. */
export const sanitizeFileName = (name: string): string =>
  name.replace(/[/\\]/g, '_').replace(/[\x00-\x1f]/g, '').trim().slice(0, 255) || 'untitled';

/** Generates a collision-proof storage key that preserves the original extension. */
export const generateStorageKey = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  return `${uuid()}${ext}`;
};

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.com', '.scr', '.js', '.jar', '.vbs', '.ps1',
]);

export const isDangerousExtension = (name: string): boolean =>
  DANGEROUS_EXTENSIONS.has(path.extname(name).toLowerCase());
