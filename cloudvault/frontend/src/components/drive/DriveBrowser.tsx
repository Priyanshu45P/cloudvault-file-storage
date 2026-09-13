import { useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive, ArrowUpDown, CheckSquare, Download, Eye, File, FileText, Folder, FolderInput,
  Grid3X3, Image, Info, Link2, List, MoreVertical, Music, Pencil, RotateCcw, Share2,
  Star, Trash2, UploadCloud, Video, XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { driveApi } from '../../api/drive';
import { DriveFile, DriveFolder, DriveListing } from '../../types/drive';
import { formatBytes } from '../../utils/formatBytes';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../ui/EmptyState';
import { PreviewModal } from './PreviewModal';
import { MoveDialog } from './MoveDialog';
import { ShareDialog } from './ShareDialog';
import { VersionDialog } from './VersionDialog';
import { FileThumbnail } from './FileThumbnail';

export type BrowserSource = 'drive' | 'recent' | 'starred' | 'trash' | 'shared' | 'shared-folder';

type DriveItem = { type: 'file'; value: DriveFile } | { type: 'folder'; value: DriveFolder };

function iconForFile(file: DriveFile) {
  if (file.mimeType.startsWith('image/')) return Image;
  if (file.mimeType.startsWith('video/')) return Video;
  if (file.mimeType.startsWith('audio/')) return Music;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(file.extension)) return Archive;
  if (file.mimeType.includes('pdf') || file.mimeType.includes('text') || file.mimeType.includes('document')) return FileText;
  return File;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function errorMessage(error: any, fallback: string) {
  return error?.response?.data?.message ?? fallback;
}

function ItemMenu({ item, trashMode, sharedMode, onAction }: { item: DriveItem; trashMode: boolean; sharedMode: boolean; onAction: (action: string, item: DriveItem) => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const file = item.type === 'file';
  const actions = trashMode
    ? [
        ['restore', RotateCcw, 'Restore'],
        ['permanent', XCircle, 'Delete forever'],
      ]
    : sharedMode
      ? file
        ? [['preview', Eye, 'Preview'], ['download', Download, 'Download'], ['versions', RotateCcw, 'Version history'], ['details', Info, 'Details']]
        : [['open', Folder, 'Open'], ['details', Info, 'Details']]
      : [
          ...(file ? [['preview', Eye, 'Preview'], ['download', Download, 'Download'], ['versions', RotateCcw, 'Version history']] : [['open', Folder, 'Open']]),
          ['rename', Pencil, 'Rename'], ['move', FolderInput, 'Move'], ['star', Star, item.value.isStarred ? 'Remove star' : 'Add to starred'],
          ['share', Share2, 'Share'], ['link', Link2, 'Copy public link'], ['details', Info, 'Details'], ['trash', Trash2, 'Move to trash'],
        ];

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700" aria-label="More actions"><MoreVertical className="h-4 w-4" /></button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card dark:border-slate-700 dark:bg-vault-dark-surface">
          {actions.map(([key, Icon, label]: any) => (
            <button key={key} onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(key, item); }} className={clsx('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800', key === 'trash' || key === 'permanent' ? 'text-red-600' : 'text-slate-700 dark:text-slate-200')}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DriveBrowser({ source = 'drive', folderId, query = '' }: { source?: BrowserSource; folderId?: string; query?: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();
  const [view, setView] = useState<'list' | 'grid'>(() => (localStorage.getItem('cloudvault-view-preference') as 'list' | 'grid') || 'list');
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [preview, setPreview] = useState<DriveFile | null>(null);
  const [moveItem, setMoveItem] = useState<DriveItem | null>(null);
  const [shareItem, setShareItem] = useState<DriveItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<DriveItem | null>(null);
  const [versionFile, setVersionFile] = useState<DriveFile | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const queryKey = ['items', source, folderId ?? null, query, sort, order];
  const { data, isLoading, isError } = useQuery<DriveListing>({
    queryKey,
    queryFn: () => {
      if (query.trim()) return driveApi.search(query.trim());
      if (source === 'recent') return driveApi.recent();
      if (source === 'starred') return driveApi.starred();
      if (source === 'trash') return driveApi.trash();
      if (source === 'shared') return driveApi.shared();
      if (source === 'shared-folder' && folderId) return driveApi.sharedFolder(folderId);
      return driveApi.list({ folderId, sort, order });
    },
  });

  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ['activity', detailsItem?.value.id ?? null],
    queryFn: driveApi.activity,
    enabled: !!detailsItem && !!user && detailsItem.value.ownerId === user.id,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['items'] });
    await queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    await refreshUser().catch(() => undefined);
  };

  const upload = async (accepted: File[]) => {
    if (!accepted.length || source !== 'drive' || query) return;
    try {
      setUploadProgress(0);
      const result = await driveApi.upload(accepted, folderId, setUploadProgress);
      showToast(`${result.uploadedCount} ${result.uploadedCount === 1 ? 'file' : 'files'} uploaded`, 'success');
      await refresh();
    } catch (error) { showToast(errorMessage(error, 'Upload failed'), 'error'); }
    finally { setUploadProgress(null); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: upload, noClick: true, disabled: source !== 'drive' || !!query });

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];
  const items = useMemo<DriveItem[]>(() => [
    ...folders.map((value) => ({ type: 'folder' as const, value })),
    ...files.map((value) => ({ type: 'file' as const, value })),
  ], [folders, files]);

  const sharedMode = source === 'shared' || source === 'shared-folder';
  const trashMode = source === 'trash';
  const isOwner = (item: DriveItem) => item.value.ownerId === user?.id;

  const openItem = (item: DriveItem) => {
    if (item.type === 'file') return setPreview(item.value);
    if (sharedMode && item.value.ownerId !== user?.id) navigate(`/shared/folder/${item.value.id}`);
    else navigate(`/drive/folder/${item.value.id}`);
  };

  const download = async (file: DriveFile) => {
    try {
      const blob = await driveApi.downloadBlob(file.id);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = href; a.download = file.originalName; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (error) { showToast(errorMessage(error, 'Download failed'), 'error'); }
  };

  const action = async (name: string, item: DriveItem) => {
    try {
      if (name === 'open') return openItem(item);
      if (name === 'preview' && item.type === 'file') return setPreview(item.value);
      if (name === 'download' && item.type === 'file') return download(item.value);
      if (name === 'details') return setDetailsItem(item);
      if (name === 'versions' && item.type === 'file') return setVersionFile(item.value);
      if (!isOwner(item) && !trashMode) return showToast('Only the owner can modify this item', 'info');
      if (name === 'rename') {
        const current = item.type === 'file' ? item.value.originalName : item.value.name;
        const next = window.prompt('Rename item', current)?.trim();
        if (!next || next === current) return;
        if (item.type === 'file') await driveApi.renameFile(item.value.id, next); else await driveApi.renameFolder(item.value.id, next);
        showToast('Renamed successfully', 'success'); await refresh(); return;
      }
      if (name === 'move') { setMoveItem(item); return; }
      if (name === 'share') { setShareItem(item); return; }
      if (name === 'link') {
        const result = item.type === 'file' ? await driveApi.shareLinkFile(item.value.id) : await driveApi.shareLinkFolder(item.value.id);
        const url = `${window.location.origin}${result.urlPath}`;
        await navigator.clipboard?.writeText(url); showToast('Public link copied', 'success'); return;
      }
      if (name === 'star') {
        if (item.type === 'file') await driveApi.starFile(item.value.id); else await driveApi.starFolder(item.value.id);
        await refresh(); return;
      }
      if (name === 'trash') {
        if (!window.confirm('Move this item to trash?')) return;
        if (item.type === 'file') await driveApi.trashFile(item.value.id); else await driveApi.trashFolder(item.value.id);
        showToast('Moved to trash', 'success'); await refresh(); return;
      }
      if (name === 'restore') {
        if (item.type === 'file') await driveApi.restoreFile(item.value.id); else await driveApi.restoreFolder(item.value.id);
        showToast('Item restored', 'success'); await refresh(); return;
      }
      if (name === 'permanent') {
        if (!window.confirm('Delete forever? This cannot be undone.')) return;
        if (item.type === 'file') await driveApi.permanentDeleteFile(item.value.id); else await driveApi.permanentDeleteFolder(item.value.id);
        showToast('Deleted permanently', 'success'); await refresh(); return;
      }
    } catch (error) { showToast(errorMessage(error, 'Action failed'), 'error'); }
  };

  const move = async (destination: string | null) => {
    if (!moveItem) return;
    try {
      if (moveItem.type === 'file') await driveApi.moveFile(moveItem.value.id, destination); else await driveApi.moveFolder(moveItem.value.id, destination);
      showToast('Item moved', 'success'); setMoveItem(null); await refresh();
    } catch (error) { showToast(errorMessage(error, 'Move failed'), 'error'); }
  };

  const startDrag = (event: React.DragEvent, item: DriveItem) => {
    if (trashMode || sharedMode || !isOwner(item)) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-cloudvault-item', JSON.stringify({ type: item.type, id: item.value.id }));
  };

  const dropOnFolder = async (event: React.DragEvent, destination: DriveItem) => {
    if (destination.type !== 'folder' || trashMode || sharedMode) return;
    event.preventDefault();
    try {
      const raw = event.dataTransfer.getData('application/x-cloudvault-item');
      if (!raw) return;
      const payload = JSON.parse(raw) as { type: 'file' | 'folder'; id: string };
      if (payload.type === 'folder' && payload.id === destination.value.id) return;
      if (payload.type === 'file') await driveApi.moveFile(payload.id, destination.value.id);
      else await driveApi.moveFolder(payload.id, destination.value.id);
      showToast('Item moved', 'success');
      await refresh();
    } catch (error) { showToast(errorMessage(error, 'Move failed'), 'error'); }
  };

  const toggleSelected = (item: DriveItem) => {
    const key = `${item.type}:${item.value.id}`;
    setSelected((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  const selectedItems = items.filter((item) => selected.has(`${item.type}:${item.value.id}`));
  const bulk = async (kind: 'star' | 'trash' | 'restore' | 'permanent') => {
    if (!selectedItems.length) return;
    if ((kind === 'trash' || kind === 'permanent') && !window.confirm(kind === 'permanent' ? 'Delete selected items forever?' : 'Move selected items to trash?')) return;
    try {
      for (const item of selectedItems) {
        if (kind === 'star') item.type === 'file' ? await driveApi.starFile(item.value.id) : await driveApi.starFolder(item.value.id);
        if (kind === 'trash') item.type === 'file' ? await driveApi.trashFile(item.value.id) : await driveApi.trashFolder(item.value.id);
        if (kind === 'restore') item.type === 'file' ? await driveApi.restoreFile(item.value.id) : await driveApi.restoreFolder(item.value.id);
        if (kind === 'permanent') item.type === 'file' ? await driveApi.permanentDeleteFile(item.value.id) : await driveApi.permanentDeleteFolder(item.value.id);
      }
      setSelected(new Set()); await refresh(); showToast('Bulk action completed', 'success');
    } catch (error) { showToast(errorMessage(error, 'Bulk action failed'), 'error'); }
  };

  const setViewAndSave = (value: 'list' | 'grid') => { setView(value); localStorage.setItem('cloudvault-view-preference', value); };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setSelected(new Set(items.map((item) => `${item.type}:${item.value.id}`)));
      } else if (event.key === 'Escape') {
        setSelected(new Set());
      } else if (event.key === 'Delete' && selected.size > 0 && !sharedMode) {
        event.preventDefault();
        void bulk(trashMode ? 'permanent' : 'trash');
      } else if (event.key === 'Enter' && selectedItems.length === 1) {
        openItem(selectedItems[0]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div {...getRootProps()} className="relative min-h-[420px] outline-none">
      <input {...getInputProps()} />
      {isDragActive && <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-vault-sky bg-vault-sky/10 backdrop-blur-sm"><div className="rounded-2xl bg-white px-8 py-6 text-center shadow-card dark:bg-vault-dark-surface"><UploadCloud className="mx-auto h-8 w-8 text-vault-sky" /><p className="mt-2 font-medium">Drop files to upload</p></div></div>}
      {uploadProgress !== null && <div className="mb-3 rounded-xl border border-vault-sky/30 bg-vault-sky/5 px-4 py-3"><div className="flex justify-between text-xs text-slate-500"><span>Uploading files…</span><span>{uploadProgress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-vault-sky transition-all" style={{ width: `${uploadProgress}%` }} /></div></div>}

      {(data?.breadcrumb?.length ?? 0) > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link to={sharedMode ? '/shared' : '/drive'} className="hover:text-vault-blue">{sharedMode ? 'Shared with Me' : 'My Drive'}</Link>
          {data!.breadcrumb!.map((crumb) => <span key={crumb.id} className="flex items-center gap-1"><span>/</span><Link className="hover:text-vault-blue" to={sharedMode ? `/shared/folder/${crumb.id}` : `/drive/folder/${crumb.id}`}>{crumb.name}</Link></span>)}
        </nav>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {selected.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-vault-deep/5 px-3 py-2 text-sm"><CheckSquare className="h-4 w-4 text-vault-deep" /><span>{selected.size} selected</span>{trashMode ? <><button onClick={() => bulk('restore')} className="rounded-lg px-2 py-1 hover:bg-white">Restore</button><button onClick={() => bulk('permanent')} className="rounded-lg px-2 py-1 text-red-600 hover:bg-white">Delete forever</button></> : !sharedMode && <><button onClick={() => bulk('star')} className="rounded-lg px-2 py-1 hover:bg-white">Star</button><button onClick={() => bulk('trash')} className="rounded-lg px-2 py-1 text-red-600 hover:bg-white">Trash</button></>}</div>
        ) : <span className="text-xs text-slate-400">{items.length} {items.length === 1 ? 'item' : 'items'}</span>}
        {!trashMode && !sharedMode && source === 'drive' && !query && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-vault-dark-surface"><ArrowUpDown className="h-3.5 w-3.5" /><select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent outline-none"><option value="updatedAt">Modified</option><option value="name">Name</option><option value="size">Size</option></select><button onClick={() => setOrder((v) => v === 'asc' ? 'desc' : 'asc')} className="px-1">{order === 'asc' ? '↑' : '↓'}</button></label>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-vault-dark-surface"><button onClick={() => setViewAndSave('list')} className={clsx('rounded-md p-1.5', view === 'list' && 'bg-slate-100 dark:bg-slate-700')} aria-label="List view"><List className="h-4 w-4" /></button><button onClick={() => setViewAndSave('grid')} className={clsx('rounded-md p-1.5', view === 'grid' && 'bg-slate-100 dark:bg-slate-700')} aria-label="Grid view"><Grid3X3 className="h-4 w-4" /></button></div>
          </div>
        )}
      </div>

      {isLoading && <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400 shadow-soft dark:bg-vault-dark-surface">Loading your files…</div>}
      {isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">CloudVault could not load this location. Check that the backend and database are running.</div>}
      {!isLoading && !isError && items.length === 0 && <EmptyState icon={source === 'trash' ? Trash2 : source === 'starred' ? Star : Folder} title={query ? `No results for “${query}”` : source === 'trash' ? 'Trash is empty' : source === 'shared' ? 'Nothing shared with you yet' : source === 'starred' ? 'No starred items' : source === 'recent' ? 'No recent files' : 'This location is empty'} description={query ? 'Try another file or folder name.' : source === 'drive' ? 'Upload files, drag files here, or create a folder using the New button.' : 'Items will appear here when they match this section.'} />}

      {!isLoading && items.length > 0 && view === 'list' && (
        <div className="overflow-visible rounded-2xl bg-white shadow-soft dark:bg-vault-dark-surface">
          <div className="grid grid-cols-[36px_minmax(0,1fr)_minmax(100px,180px)_160px_90px_40px] items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-400 dark:border-slate-700 max-md:grid-cols-[32px_minmax(0,1fr)_40px]"><span /><span>Name</span><span className="max-md:hidden">Owner</span><span className="max-md:hidden">Last modified</span><span className="max-md:hidden">Size</span><span /></div>
          {items.map((item) => {
            const name = item.type === 'file' ? item.value.originalName : item.value.name;
            const Icon = item.type === 'file' ? iconForFile(item.value) : Folder;
            const key = `${item.type}:${item.value.id}`;
            return <div key={key} draggable={!trashMode && !sharedMode && isOwner(item)} onDragStart={(e) => startDrag(e, item)} onDragOver={(e) => { if (item.type === 'folder') e.preventDefault(); }} onDrop={(e) => void dropOnFolder(e, item)} onDoubleClick={() => openItem(item)} className="grid grid-cols-[36px_minmax(0,1fr)_minmax(100px,180px)_160px_90px_40px] items-center gap-2 border-b border-slate-50 px-3 py-2.5 text-sm last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 max-md:grid-cols-[32px_minmax(0,1fr)_40px]"><input type="checkbox" checked={selected.has(key)} onChange={() => toggleSelected(item)} className="h-4 w-4 rounded border-slate-300" /><button onClick={() => openItem(item)} className="flex min-w-0 items-center gap-3 text-left"><span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', item.type === 'folder' ? 'bg-vault-sky/10 text-vault-sky' : 'bg-vault-deep/10 text-vault-deep')}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="flex items-center gap-1.5 truncate font-medium text-slate-700 dark:text-slate-200">{name}{item.value.isStarred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}</span>{sharedMode && item.value.sharedBy && <span className="block truncate text-[11px] text-slate-400">Shared by {item.value.sharedBy.fullName}</span>}</span></button><span className="truncate text-xs text-slate-500 max-md:hidden">{item.value.owner?.fullName ?? 'Me'}</span><span className="text-xs text-slate-500 max-md:hidden">{dateLabel(item.value.updatedAt)}</span><span className="text-xs text-slate-500 max-md:hidden">{item.type === 'file' ? formatBytes(item.value.size) : '—'}</span><ItemMenu item={item} trashMode={trashMode} sharedMode={sharedMode && !isOwner(item)} onAction={action} /></div>;
          })}
        </div>
      )}

      {!isLoading && items.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => { const name = item.type === 'file' ? item.value.originalName : item.value.name; const Icon = item.type === 'file' ? iconForFile(item.value) : Folder; const key = `${item.type}:${item.value.id}`; return <div key={key} draggable={!trashMode && !sharedMode && isOwner(item)} onDragStart={(e) => startDrag(e, item)} onDragOver={(e) => { if (item.type === 'folder') e.preventDefault(); }} onDrop={(e) => void dropOnFolder(e, item)} onDoubleClick={() => openItem(item)} className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-soft hover:border-vault-sky/50 dark:border-slate-700 dark:bg-vault-dark-surface"><div className="flex items-start justify-between"><input type="checkbox" checked={selected.has(key)} onChange={() => toggleSelected(item)} className="h-4 w-4 rounded border-slate-300" /><ItemMenu item={item} trashMode={trashMode} sharedMode={sharedMode && !isOwner(item)} onAction={action} /></div><button onClick={() => openItem(item)} className="mt-2 flex w-full flex-col items-center"><span className={clsx('flex h-24 w-full items-center justify-center overflow-hidden rounded-xl', item.type === 'folder' ? 'bg-vault-sky/10 text-vault-sky' : 'bg-slate-50 text-vault-deep dark:bg-slate-800')}>{item.type === 'file' ? <FileThumbnail file={item.value} fallback={<Icon className="h-10 w-10" />} /> : <Icon className="h-10 w-10" />}</span><span className="mt-3 flex max-w-full items-center gap-1 truncate text-sm font-medium">{name}{item.value.isStarred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}</span><span className="mt-1 text-xs text-slate-400">{item.type === 'file' ? formatBytes(item.value.size) : 'Folder'}</span></button></div>; })}
        </div>
      )}

      <PreviewModal file={preview} onClose={() => setPreview(null)} />
      <VersionDialog file={versionFile} onClose={() => setVersionFile(null)} />
      <MoveDialog open={!!moveItem} onClose={() => setMoveItem(null)} excludeId={moveItem?.type === 'folder' ? moveItem.value.id : undefined} onMove={move} />
      {shareItem && <ShareDialog open type={shareItem.type} id={shareItem.value.id} name={shareItem.type === 'file' ? shareItem.value.originalName : shareItem.value.name} onClose={() => setShareItem(null)} />}
      {detailsItem && <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/20" onClick={() => setDetailsItem(null)}><aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-sm overflow-y-auto bg-white p-5 shadow-card dark:bg-vault-dark-surface"><div className="flex justify-between"><h2 className="font-semibold">Details</h2><button onClick={() => setDetailsItem(null)} className="text-slate-400">✕</button></div><div className="mt-6 space-y-4 text-sm"><div><p className="text-xs text-slate-400">Name</p><p className="mt-1 break-words">{detailsItem.type === 'file' ? detailsItem.value.originalName : detailsItem.value.name}</p></div><div><p className="text-xs text-slate-400">Owner</p><p className="mt-1">{detailsItem.value.owner?.fullName ?? 'Me'} · {detailsItem.value.owner?.email ?? user?.email}</p></div><div><p className="text-xs text-slate-400">Modified</p><p className="mt-1">{dateLabel(detailsItem.value.updatedAt)}</p></div><div><p className="text-xs text-slate-400">Created</p><p className="mt-1">{dateLabel(detailsItem.value.createdAt)}</p></div>{detailsItem.type === 'file' && <><div><p className="text-xs text-slate-400">Type</p><p className="mt-1">{detailsItem.value.mimeType}</p></div><div><p className="text-xs text-slate-400">Size</p><p className="mt-1">{formatBytes(detailsItem.value.size)}</p></div></>}<div className="border-t border-slate-100 pt-4 dark:border-slate-700"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Recent activity</p><div className="mt-3 space-y-3">{activities.filter((a: any) => detailsItem.type === 'file' ? a.fileId === detailsItem.value.id : a.folderId === detailsItem.value.id).slice(0, 8).map((a: any) => <div key={a.id} className="text-xs"><p className="font-medium text-slate-600 dark:text-slate-300">{String(a.action).toLowerCase().replace('_', ' ')}</p><p className="text-slate-400">{dateLabel(a.createdAt)}</p></div>)}{activities.filter((a: any) => detailsItem.type === 'file' ? a.fileId === detailsItem.value.id : a.folderId === detailsItem.value.id).length === 0 && <p className="text-xs text-slate-400">No activity recorded yet.</p>}</div></div></div></aside></div>}
    </div>
  );
}
