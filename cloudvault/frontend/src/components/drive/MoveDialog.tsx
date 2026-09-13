import { useQuery } from '@tanstack/react-query';
import { Folder, X } from 'lucide-react';
import { driveApi } from '../../api/drive';
import { Button } from '../ui/Button';

export function MoveDialog({ open, onClose, onMove, excludeId }: { open: boolean; onClose: () => void; onMove: (folderId: string | null) => Promise<void>; excludeId?: string }) {
  const { data = [], isLoading } = useQuery({ queryKey: ['folder-options'], queryFn: driveApi.folderOptions, enabled: open });
  const options = data.filter((folder) => folder.id !== excludeId);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card dark:bg-vault-dark-surface">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Move to</h2><button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
        <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700">
          <button onClick={() => onMove(null)} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Folder className="h-4 w-4 text-vault-sky" /> My Drive</button>
          {isLoading && <p className="p-3 text-sm text-slate-400">Loading folders…</p>}
          {options.map((folder) => <button key={folder.id} onClick={() => onMove(folder.id)} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left text-sm last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Folder className="h-4 w-4 text-vault-sky" /><span className="truncate">{folder.name}</span></button>)}
        </div>
        <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </div>
    </div>
  );
}
