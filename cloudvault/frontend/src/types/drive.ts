export interface DriveOwner {
  id: string;
  fullName: string;
  email: string;
}

export interface DriveFile {
  id: string;
  originalName: string;
  storedName?: string;
  mimeType: string;
  extension: string;
  size: string;
  ownerId: string;
  folderId: string | null;
  isStarred: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: DriveOwner;
  permission?: 'VIEWER' | 'EDITOR';
  sharedBy?: DriveOwner;
}

export interface DriveFolder {
  id: string;
  name: string;
  ownerId: string;
  parentFolderId: string | null;
  isStarred: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: DriveOwner;
  permission?: 'VIEWER' | 'EDITOR';
  sharedBy?: DriveOwner;
  _count?: { children: number; files: number };
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface DriveListing {
  files: DriveFile[];
  folders: DriveFolder[];
  breadcrumb?: BreadcrumbItem[];
  folder?: DriveFolder;
}

export interface FolderOption {
  id: string;
  name: string;
  parentFolderId: string | null;
}

export interface StorageStats {
  storageUsed: string;
  storageLimit: string;
  categories: Record<'Images' | 'Videos' | 'Documents' | 'Audio' | 'Archives' | 'Other', string>;
  fileCount: number;
}

export interface PublicShareInfo {
  link: {
    token: string;
    permission: 'VIEWER' | 'EDITOR';
    expiresAt: string | null;
  };
  file: DriveFile | null;
  folder: DriveFolder | null;
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  originalName: string;
  mimeType: string;
  extension: string;
  size: string;
  createdAt: string;
}

export interface FileVersionsResponse {
  current: DriveFile;
  versions: FileVersion[];
  canEdit: boolean;
}
