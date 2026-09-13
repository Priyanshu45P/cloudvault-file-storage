import { useState } from 'react';
import { Copy, Link2, X } from 'lucide-react';
import { driveApi } from '../../api/drive';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

export function ShareDialog({ open, onClose, type, id, name }: { open: boolean; onClose: () => void; type: 'file' | 'folder'; id: string; name: string }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  const { showToast } = useToast();
  if (!open) return null;

  const share = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      if (type === 'file') await driveApi.shareFile(id, email.trim(), permission); else await driveApi.shareFolder(id, email.trim(), permission);
      showToast(`Shared with ${email.trim()}`, 'success'); setEmail('');
    } catch (error: any) { showToast(error?.response?.data?.message ?? 'Sharing failed', 'error'); }
    finally { setLoading(false); }
  };
  const createLink = async () => {
    setLoading(true);
    try {
      const result = type === 'file' ? await driveApi.shareLinkFile(id, expiryDays) : await driveApi.shareLinkFolder(id, expiryDays);
      const url = `${window.location.origin}${result.urlPath}`; setLink(url);
      await navigator.clipboard?.writeText(url); showToast('Share link copied', 'success');
    } catch (error: any) { showToast(error?.response?.data?.message ?? 'Could not create link', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-card dark:bg-vault-dark-surface">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-800 dark:text-white">Share “{name}”</h2><p className="mt-1 text-xs text-slate-400">Share with another CloudVault account or create a public view link.</p></div><button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
        <div className="mt-5 flex gap-2"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-vault-sky dark:border-slate-700 dark:bg-slate-800" /><select value={permission} onChange={(e) => setPermission(e.target.value as any)} className="rounded-xl border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option></select><Button isLoading={loading} onClick={share}>Share</Button></div>
        <div className="my-5 border-t border-slate-100 dark:border-slate-700" />
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-vault-sky" /><div><p className="text-sm font-medium">Public link</p><p className="text-xs text-slate-400">Anyone with the link can view this item.</p></div></div><div className="flex items-center gap-2"><select value={expiryDays ?? ''} onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : undefined)} className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="">Never expires</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select><Button variant="secondary" onClick={createLink}><Copy className="h-4 w-4" /> Copy link</Button></div></div>
        {link && <p className="mt-3 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800">{link}</p>}
      </div>
    </div>
  );
}
