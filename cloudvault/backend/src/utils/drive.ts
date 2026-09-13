import path from 'path';

export const serializeFile = (file: any) => ({
  ...file,
  size: typeof file.size === 'bigint' ? file.size.toString() : String(file.size ?? 0),
  owner: file.owner ? { id: file.owner.id, fullName: file.owner.fullName, email: file.owner.email } : undefined,
});

export const serializeFolder = (folder: any) => ({
  ...folder,
  owner: folder.owner ? { id: folder.owner.id, fullName: folder.owner.fullName, email: folder.owner.email } : undefined,
});

export const categoryForMime = (mimeType: string, extension = '') => {
  if (mimeType.startsWith('image/')) return 'Images';
  if (mimeType.startsWith('video/')) return 'Videos';
  if (mimeType.startsWith('audio/')) return 'Audio';
  const ext = extension.toLowerCase();
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Archives';
  if (
    mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('document') ||
    mimeType.includes('sheet') || mimeType.includes('presentation') ||
    ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md'].includes(ext)
  ) return 'Documents';
  return 'Other';
};

export const splitName = (name: string) => {
  const ext = path.extname(name);
  return { base: ext ? name.slice(0, -ext.length) : name, ext };
};
