import { Image, Video, FileText, Music, Archive, File as FileIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatBytes, storagePercentage } from '../utils/formatBytes';

const CATEGORIES = [
  { label: 'Images', icon: Image, color: 'bg-vault-sky' },
  { label: 'Videos', icon: Video, color: 'bg-vault-purple' },
  { label: 'Documents', icon: FileText, color: 'bg-vault-deep' },
  { label: 'Audio', icon: Music, color: 'bg-emerald-500' },
  { label: 'Archives', icon: Archive, color: 'bg-amber-500' },
  { label: 'Other', icon: FileIcon, color: 'bg-slate-400' },
];

export default function StoragePage() {
  const { user } = useAuth();
  if (!user) return null;

  const percent = storagePercentage(user.storageUsed, user.storageLimit);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Storage</h1>

      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Used</p>
            <p className="text-2xl font-semibold text-slate-800 dark:text-white">
              {formatBytes(user.storageUsed)}{' '}
              <span className="text-base font-normal text-slate-400">
                of {formatBytes(user.storageLimit)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Available</p>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
              {formatBytes(Number(user.storageLimit) - Number(user.storageUsed))}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-vault-sky transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">{percent}% of your storage used</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Usage by category
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ label, icon: Icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-700"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color} text-white`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-400">0 B</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
