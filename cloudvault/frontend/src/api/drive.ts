import { AxiosProgressEvent } from 'axios';
import { apiClient } from './client';
import { DriveListing, FileVersionsResponse, FolderOption, PublicShareInfo, StorageStats } from '../types/drive';

interface ApiEnvelope<T> { success: boolean; data: T }

const data = <T>(response: { data: ApiEnvelope<T> }) => response.data.data;

export const driveApi = {
  list: async (params: { folderId?: string; q?: string; sort?: string; order?: string } = {}) =>
    data(await apiClient.get<ApiEnvelope<DriveListing>>('/drive', { params })),

  search: async (q: string) => data(await apiClient.get<ApiEnvelope<DriveListing>>('/search', { params: { q } })),
  recent: async () => data(await apiClient.get<ApiEnvelope<DriveListing>>('/recent')),
  starred: async () => data(await apiClient.get<ApiEnvelope<DriveListing>>('/starred')),
  trash: async () => data(await apiClient.get<ApiEnvelope<DriveListing>>('/trash')),
  shared: async () => data(await apiClient.get<ApiEnvelope<DriveListing>>('/shared')),
  sharedFolder: async (id: string) => data(await apiClient.get<ApiEnvelope<DriveListing>>(`/shared/folder/${id}`)),

  upload: async (files: File[], folderId?: string, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    if (folderId) form.append('folderId', folderId);
    return data(await apiClient.post<ApiEnvelope<{ uploadedCount: number }>>('/files/upload', form, {
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    }));
  },

  createFolder: async (name: string, parentFolderId?: string) =>
    data(await apiClient.post('/folders', { name, parentFolderId })),
  folderOptions: async () => data<FolderOption[]>(await apiClient.get('/folders/options')),

  renameFile: async (id: string, name: string) => data(await apiClient.patch(`/files/${id}/rename`, { name })),
  renameFolder: async (id: string, name: string) => data(await apiClient.patch(`/folders/${id}/rename`, { name })),
  moveFile: async (id: string, folderId: string | null) => data(await apiClient.patch(`/files/${id}/move`, { folderId })),
  moveFolder: async (id: string, parentFolderId: string | null) => data(await apiClient.patch(`/folders/${id}/move`, { parentFolderId })),
  starFile: async (id: string) => data(await apiClient.patch(`/files/${id}/star`)),
  starFolder: async (id: string) => data(await apiClient.patch(`/folders/${id}/star`)),
  trashFile: async (id: string) => data(await apiClient.delete(`/files/${id}`)),
  trashFolder: async (id: string) => data(await apiClient.delete(`/folders/${id}`)),
  restoreFile: async (id: string) => data(await apiClient.post(`/files/${id}/restore`)),
  restoreFolder: async (id: string) => data(await apiClient.post(`/folders/${id}/restore`)),
  permanentDeleteFile: async (id: string) => data(await apiClient.delete(`/files/${id}/permanent`)),
  permanentDeleteFolder: async (id: string) => data(await apiClient.delete(`/folders/${id}/permanent`)),
  emptyTrash: async () => data(await apiClient.delete('/trash')),

  shareFile: async (id: string, email: string, permission: 'VIEWER' | 'EDITOR') =>
    data(await apiClient.post(`/files/${id}/share`, { email, permission })),
  shareFolder: async (id: string, email: string, permission: 'VIEWER' | 'EDITOR') =>
    data(await apiClient.post(`/folders/${id}/share`, { email, permission })),
  shareLinkFile: async (id: string, expiresInDays?: number) =>
    data<{ token: string; urlPath: string }>(await apiClient.post(`/files/${id}/share-link`, { permission: 'VIEWER', expiresInDays })),
  shareLinkFolder: async (id: string, expiresInDays?: number) =>
    data<{ token: string; urlPath: string }>(await apiClient.post(`/folders/${id}/share-link`, { permission: 'VIEWER', expiresInDays })),

  storageStats: async () => data<StorageStats>(await apiClient.get('/storage/stats')),
  activity: async () => data<any[]>(await apiClient.get('/activity')),

  versions: async (id: string) => data<FileVersionsResponse>(await apiClient.get(`/files/${id}/versions`)),
  uploadVersion: async (id: string, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData(); form.append('files', file);
    return data(await apiClient.post(`/files/${id}/versions`, form, { onUploadProgress: (event: AxiosProgressEvent) => { if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100)); } }));
  },
  restoreVersion: async (id: string, versionId: string) => data(await apiClient.post(`/files/${id}/versions/${versionId}/restore`)),
  downloadVersionBlob: async (id: string, versionId: string) => (await apiClient.get(`/files/${id}/versions/${versionId}/download`, { responseType: 'blob' })).data as Blob,

  previewBlob: async (id: string) => (await apiClient.get(`/files/${id}/preview`, { responseType: 'blob' })).data as Blob,
  downloadBlob: async (id: string) => (await apiClient.get(`/files/${id}/download`, { responseType: 'blob' })).data as Blob,

  publicInfo: async (token: string) => data<PublicShareInfo>(await apiClient.get(`/public/${token}`)),
  publicFolder: async (token: string, folderId?: string) => data<DriveListing>(await apiClient.get(`/public/${token}/folder`, { params: { folderId } })),
};
