import { StorageProvider } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';

// To switch providers in the future:
//   import { S3StorageProvider } from './S3StorageProvider';
//   export const storageProvider: StorageProvider = new S3StorageProvider();
export const storageProvider: StorageProvider = new LocalStorageProvider();
