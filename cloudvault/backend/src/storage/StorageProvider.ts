/**
 * Abstraction over the physical storage backend. The rest of the app only
 * depends on this interface, so swapping local disk storage for S3,
 * Cloudinary, or Supabase Storage later requires implementing this
 * interface and changing one line in storage/index.ts - no other code
 * needs to change.
 */
export interface StorageProvider {
  /** Persists a file buffer/stream under a unique storage key and returns the storage path/URL. */
  save(storageKey: string, data: Buffer): Promise<string>;

  /** Reads a file back as a Buffer. */
  read(storageKey: string): Promise<Buffer>;

  /** Permanently removes a file from the backing store. */
  delete(storageKey: string): Promise<void>;

  /** Returns whether a file exists in storage. */
  exists(storageKey: string): Promise<boolean>;
}
