import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, History, RotateCcw, Upload, X } from 'lucide-react';
import { driveApi } from '../../api/drive';
import { DriveFile } from '../../types/drive';
import { formatBytes } from '../../utils/formatBytes';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function VersionDialog({ file, onClose }: { file: DriveFile | null; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({ queryKey: ['versions', file?.id], queryFn: () => driveApi.versions(file!.id), enabled: !!file });
  if (!file) return null;

  const invalidate = async () => { await refetch(); await queryClient.invalidateQueries({ queryKey: ['items'] }); await queryClient.invalidateQueries({ queryKey: ['storage-stats'] }); await refreshUser().catch(() => undefined); };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0]; event.target.value = ''; if (!next) return;
    setUploading(true); setProgress(0);
    try { await driveApi.uploadVersion(file.id, next, setProgress); showToast('New version uploaded', 'success'); await invalidate(); }
    catch (error: any) { showToast(error?.response?.data?.message ?? 'Version upload failed', 'error'); }
    finally { setUploading(false); }
  };
  const restore = async (versionId: string) => {
    if (!window.confirm('Restore this version as the current file? The current file will be kept in version history.')) return;
    try { await driveApi.restoreVersion(file.id, versionId); showToast('Version restored', 'success'); await invalidate(); }
    catch (error: any) { showToast(error?.response?.data?.message ?? 'Could not restore version', 'error'); }
  };
  const download = async (versionId: string, name: string) => {
    try { const blob = await driveApi.downloadVersionBlob(file.id, versionId); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); }
    catch { showToast('Version download failed', 'error'); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-card dark:bg-vault-dark-surface"><input ref={inputRef} type="file" className="hidden" onChange={upload} /><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><History className="h-5 w-5 text-vault-sky" /><h2 className="font-semibold">Version history</h2></div><p className="mt-1 max-w-md truncate text-xs text-slate-400">{file.originalName}</p></div><button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div><p className="text-sm font-medium">Current version</p><p className="text-xs text-slate-400">{formatBytes(data?.current.size ?? file.size)} · {new Date(data?.current.updatedAt ?? file.updatedAt).toLocaleString()}</p></div>{data?.canEdit && <Button variant="secondary" isLoading={uploading} onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" /> Upload new version</Button>}</div>{uploading && <div className="mt-3"><div className="flex justify-between text-xs text-slate-400"><span>Uploading version…</span><span>{progress}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-vault-sky" style={{width:`${progress}%`}} /></div></div>}<div className="mt-4 max-h-80 overflow-y-auto">{isLoading && <p className="py-8 text-center text-sm text-slate-400">Loading versions…</p>}{!isLoading && (data?.versions.length ?? 0) === 0 && <p className="py-8 text-center text-sm text-slate-400">No older versions yet.</p>}{data?.versions.map((version) => <div key={version.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700"><div><p className="text-sm font-medium">Version {version.version}</p><p className="text-xs text-slate-400">{formatBytes(version.size)} · {new Date(version.createdAt).toLocaleString()}</p></div><div className="flex gap-1"><button onClick={() => download(version.id, version.originalName)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Download"><Download className="h-4 w-4" /></button>{data.canEdit && <button onClick={() => restore(version.id)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Restore"><RotateCcw className="h-4 w-4" /></button>}</div></div>)}</div></div></div>;
}
