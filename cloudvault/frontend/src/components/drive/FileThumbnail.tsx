import { useEffect, useState } from 'react';
import { DriveFile } from '../../types/drive';
import { driveApi } from '../../api/drive';

export function FileThumbnail({ file, fallback }: { file: DriveFile; fallback: React.ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.mimeType.startsWith('image/')) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    driveApi.previewBlob(file.id).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => undefined);
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file.id, file.mimeType]);
  if (url) return <img src={url} alt="" className="h-full w-full rounded-xl object-cover" />;
  return <>{fallback}</>;
}
