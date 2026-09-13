import { Moon, Sun, LayoutGrid, List } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

type ViewPreference = 'grid' | 'list';

const VIEW_STORAGE_KEY = 'cloudvault-view-preference';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<ViewPreference>(
    () => (localStorage.getItem(VIEW_STORAGE_KEY) as ViewPreference) || 'grid'
  );

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Settings</h1>

      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-vault-sky" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
              <p className="text-xs text-slate-400">Switch between light and dark themes</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Toggle dark mode"
            className={`relative h-7 w-12 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-vault-deep' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Default file view
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
              view === 'grid'
                ? 'border-vault-sky bg-vault-sky/10 text-vault-deep dark:text-vault-sky'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
              view === 'list'
                ? 'border-vault-sky bg-vault-sky/10 text-vault-deep dark:text-vault-sky'
                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          This preference is saved and applied automatically when you open My Drive.
        </p>
      </div>
    </div>
  );
}
