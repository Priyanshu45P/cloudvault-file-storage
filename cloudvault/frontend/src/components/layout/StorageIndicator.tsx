import { HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatBytes, storagePercentage } from '../../utils/formatBytes';

export function StorageIndicator() {
  const { user } = useAuth();
  if (!user) return null;

  const percent = storagePercentage(user.storageUsed, user.storageLimit);
  const barColor = percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-vault-sky';

  return (
    <Link
      to="/storage"
      className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 text-xs hover:border-vault-sky dark:border-slate-700"
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <HardDrive className="h-4 w-4" aria-hidden="true" />
        <span>Storage</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-slate-500 dark:text-slate-400">
        {formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)} used
      </span>
    </Link>
  );
}
