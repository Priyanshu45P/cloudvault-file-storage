import { useEffect, useState } from 'react';
import { LayoutGrid, List, LockKeyhole, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { Button } from '../components/ui/Button';

type ViewPreference = 'grid' | 'list';
const VIEW_STORAGE_KEY = 'cloudvault-view-preference';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewPreference>(() => (localStorage.getItem(VIEW_STORAGE_KEY) as ViewPreference) || 'list');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  useEffect(() => { localStorage.setItem(VIEW_STORAGE_KEY, view); }, [view]);

  const changePassword = async () => {
    if (newPassword !== confirmPassword) return showToast('New passwords do not match', 'error');
    setSavingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      await logout().catch(() => undefined);
      showToast('Password changed. Sign in with your new password.', 'success');
      navigate('/login');
    } catch (error: any) { showToast(error?.response?.data?.message ?? 'Could not change password', 'error'); }
    finally { setSavingPassword(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Settings</h1>
      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface"><h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Appearance</h2><div className="flex items-center justify-between"><div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="h-5 w-5 text-vault-sky" /> : <Sun className="h-5 w-5 text-amber-500" />}<div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p><p className="text-xs text-slate-400">Switch between light and dark themes</p></div></div><button onClick={toggleTheme} role="switch" aria-checked={theme === 'dark'} aria-label="Toggle dark mode" className={`relative h-7 w-12 rounded-full transition-colors ${theme === 'dark' ? 'bg-vault-deep' : 'bg-slate-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} /></button></div></div>
      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface"><h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Default file view</h2><div className="flex gap-2"><button onClick={() => setView('grid')} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${view === 'grid' ? 'border-vault-sky bg-vault-sky/10 text-vault-deep dark:text-vault-sky' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><LayoutGrid className="h-4 w-4" /> Grid</button><button onClick={() => setView('list')} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${view === 'list' ? 'border-vault-sky bg-vault-sky/10 text-vault-deep dark:text-vault-sky' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><List className="h-4 w-4" /> List</button></div></div>
      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface"><div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-vault-sky" /><h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Change password</h2></div><p className="mt-1 text-xs text-slate-400">Changing your password signs out existing refresh sessions.</p><div className="mt-4 grid max-w-xl gap-3"><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-vault-sky dark:border-slate-700 dark:bg-slate-800" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-vault-sky dark:border-slate-700 dark:bg-slate-800" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-vault-sky dark:border-slate-700 dark:bg-slate-800" /><div><Button isLoading={savingPassword} disabled={!currentPassword || !newPassword || !confirmPassword} onClick={changePassword}>Update password</Button></div></div></div>
    </div>
  );
}
