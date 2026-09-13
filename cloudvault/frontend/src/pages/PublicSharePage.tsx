import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Eye, File, Folder, Link2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { driveApi } from '../api/drive';
import { DriveListing, PublicShareInfo } from '../types/drive';
import { API_BASE_URL } from '../api/client';
import { formatBytes } from '../utils/formatBytes';

export default function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [info, setInfo] = useState<PublicShareInfo | null>(null);
  const [folderData, setFolderData] = useState<DriveListing | null>(null);
  const [error, setError] = useState('');
  const [loadingFolder, setLoadingFolder] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    driveApi.publicInfo(shareToken).then(async (result) => {
      setInfo(result);
      if (result.folder) {
        setLoadingFolder(true);
        try { setFolderData(await driveApi.publicFolder(shareToken, result.folder.id)); }
        finally { setLoadingFolder(false); }
      }
    }).catch((e) => setError(e?.response?.data?.message ?? 'This share link is invalid or expired.'));
  }, [shareToken]);

  const openFolder = async (id: string) => {
    if (!shareToken) return;
    setLoadingFolder(true);
    try { setFolderData(await driveApi.publicFolder(shareToken, id)); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Could not open this folder'); }
    finally { setLoadingFolder(false); }
  };

  const fileDownload = (fileId?: string) => shareToken ? `${API_BASE_URL}/public/${shareToken}${fileId ? `/file/${fileId}` : ''}/download` : '#';
  const filePreview = (fileId?: string) => shareToken ? `${API_BASE_URL}/public/${shareToken}${fileId ? `/file/${fileId}` : ''}/preview` : '#';
  const item = info?.file ?? info?.folder;
  const name = info?.file?.originalName ?? info?.folder?.name;
  const Icon = info?.folder ? Folder : File;

  return (
    <div className="min-h-screen bg-vault-bg px-4 py-8 dark:bg-vault-dark-bg">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex justify-center"><Logo size={36} /></div>
        <div className="rounded-2xl bg-white p-6 shadow-card dark:bg-vault-dark-surface">
          <div className="flex flex-col items-center gap-4 text-center"><Link2 className="h-8 w-8 text-vault-sky" /><h1 className="text-lg font-semibold text-slate-800 dark:text-white">Shared with you</h1>{error && <p className="text-sm text-red-600">{error}</p>}{!error && !info && <p className="text-sm text-slate-400">Loading shared item…</p>}{item && <><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-vault-sky/10 text-vault-sky"><Icon className="h-9 w-9" /></div><div><p className="font-medium text-slate-800 dark:text-white">{name}</p>{info?.file && <p className="mt-1 text-xs text-slate-400">{formatBytes(info.file.size)} · {info.file.mimeType}</p>}<p className="mt-1 text-xs text-slate-400">Owner: {item.owner?.fullName}</p></div>{info?.file && <div className="flex gap-2"><a href={filePreview()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"><Eye className="h-4 w-4" /> Preview</a><a href={fileDownload()} className="inline-flex items-center gap-2 rounded-xl bg-vault-deep px-4 py-2.5 text-sm font-medium text-white hover:bg-vault-blue"><Download className="h-4 w-4" /> Download</a></div>}</>}</div>

          {info?.folder && <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">{folderData?.breadcrumb && <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">{folderData.breadcrumb.map((crumb, index) => <span key={crumb.id} className="flex items-center gap-1">{index > 0 && <span>/</span>}<button onClick={() => openFolder(crumb.id)} className="hover:text-vault-blue">{crumb.name}</button></span>)}</nav>}{loadingFolder && <p className="py-8 text-center text-sm text-slate-400">Loading folder…</p>}{!loadingFolder && folderData && folderData.folders.length === 0 && folderData.files.length === 0 && <p className="py-8 text-center text-sm text-slate-400">This shared folder is empty.</p>}{!loadingFolder && folderData && (folderData.folders.length > 0 || folderData.files.length > 0) && <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700">{folderData.folders.map((folder) => <button key={folder.id} onClick={() => openFolder(folder.id)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Folder className="h-5 w-5 text-vault-sky" /><span className="font-medium">{folder.name}</span></button>)}{folderData.files.map((file) => <div key={file.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-0 dark:border-slate-700"><File className="h-5 w-5 text-vault-deep" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.originalName}</p><p className="text-xs text-slate-400">{formatBytes(file.size)}</p></div><a href={filePreview(file.id)} target="_blank" rel="noreferrer" className="rounded-lg p-2 hover:bg-slate-100" title="Preview"><Eye className="h-4 w-4" /></a><a href={fileDownload(file.id)} className="rounded-lg p-2 hover:bg-slate-100" title="Download"><Download className="h-4 w-4" /></a></div>)}</div>}</div>}
        </div>
      </div>
    </div>
  );
}
