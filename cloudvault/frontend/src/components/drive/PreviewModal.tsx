import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { DriveFile } from '../../types/drive';
import { driveApi } from '../../api/drive';
import { useToast } from '../../context/ToastContext';

export function PreviewModal({ file, onClose }: { file: DriveFile | null; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let objectUrl: string | null = null;
    if (!file) return;
    setLoading(true);
    driveApi.previewBlob(file.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => showToast('Preview could not be loaded', 'error'))
      .finally(() => setLoading(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); setUrl(null); };
  }, [file, showToast]);

  if (!file) return null;

  const download = async () => {
    try {
      const blob = await driveApi.downloadBlob(file.id);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = file.originalName; a.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch { showToast('Download failed', 'error'); }
  };

  const mime = file.mimeType || '';
  const supported = mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') || mime === 'application/pdf' || mime.startsWith('text/') || mime.includes('json');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95" role="dialog" aria-modal="true">
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 text-white">
        <p className="truncate pr-4 text-sm font-medium">{file.originalName}</p>
        <div className="flex items-center gap-2">
          <button onClick={download} className="rounded-lg p-2 hover:bg-white/10" aria-label="Download"><Download className="h-5 w-5" /></button>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close preview"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {loading && <p className="text-sm text-white/70">Loading preview…</p>}
        {!loading && url && supported && mime.startsWith('image/') && <img src={url} alt={file.originalName} className="max-h-full max-w-full object-contain" />}
        {!loading && url && supported && mime.startsWith('video/') && <video src={url} controls className="max-h-full max-w-full" />}
        {!loading && url && supported && mime.startsWith('audio/') && <audio src={url} controls className="w-full max-w-xl" />}
        {!loading && url && supported && !mime.startsWith('image/') && !mime.startsWith('video/') && !mime.startsWith('audio/') && <iframe title={file.originalName} src={url} className="h-full w-full max-w-6xl rounded bg-white" />}
        {!loading && !supported && (
          <div className="rounded-2xl bg-white/10 p-8 text-center text-white">
            <p className="font-medium">Preview unavailable for this file type.</p>
            <button onClick={download} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900">Download file</button>
          </div>
        )}
      </div>
    </div>
  );
}
