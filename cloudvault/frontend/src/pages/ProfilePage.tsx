import { useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth';
import { formatBytes } from '../utils/formatBytes';
import { Button } from '../components/ui/Button';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  const initials = user.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const save = async () => {
    setSaving(true);
    try { await authApi.updateProfile(name); await refreshUser(); setEditing(false); showToast('Profile updated', 'success'); }
    catch (error: any) { showToast(error?.response?.data?.message ?? 'Could not update profile', 'error'); }
    finally { setSaving(false); }
  };
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Profile</h1>
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-vault-purple text-xl font-semibold text-white">{initials}</span>
        <div className="min-w-0 flex-1">{editing ? <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-vault-sky dark:border-slate-700 dark:bg-slate-800" /> : <p className="text-lg font-semibold text-slate-800 dark:text-white">{user.fullName}</p>}<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p></div>
        <div className="flex gap-2">{editing ? <><Button variant="secondary" onClick={() => { setName(user.fullName); setEditing(false); }}><X className="h-4 w-4" /> Cancel</Button><Button isLoading={saving} onClick={save}><Save className="h-4 w-4" /> Save</Button></> : <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit</Button>}</div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-white p-5 shadow-soft dark:bg-vault-dark-surface"><p className="text-xs text-slate-400">Member since</p><p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p></div><div className="rounded-2xl bg-white p-5 shadow-soft dark:bg-vault-dark-surface"><p className="text-xs text-slate-400">Storage used</p><p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)}</p></div></div>
    </div>
  );
}
