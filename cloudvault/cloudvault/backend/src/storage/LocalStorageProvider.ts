import fs from 'fs/promises';
import path from 'path';
import { StorageProvider } from './StorageProvider';
import { env } from '../config/env';

/**
 * Stores files on the local filesystem under UPLOAD_DIRECTORY.
 * storageKey is expected to already be a sanitized, unique filename
 * (see utils/filename.ts) - this class never trusts user-supplied names
 * directly, preventing path traversal.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly rootDir: string;

  constructor() {
    this.rootDir = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY);
  }

  private resolveSafePath(storageKey: string): string {
    const target = path.resolve(this.rootDir, storageKey);
    if (!target.startsWith(this.rootDir)) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    return target;
  }

  async save(storageKey: string, data: Buffer): Promise<string> {
    const target = this.resolveSafePath(storageKey);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    return target;
  }

  async read(storageKey: string): Promise<Buffer> {
    return fs.readFile(this.resolveSafePath(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await fs.unlink(this.resolveSafePath(storageKey));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await fs.access(this.resolveSafePath(storageKey));
      return true;
    } catch {
      return false;
    }
  }
}
