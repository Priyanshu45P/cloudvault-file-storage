import { useAuth } from '../context/AuthContext';
import { formatBytes } from '../utils/formatBytes';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Profile</h1>

      <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-soft dark:bg-vault-dark-surface">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-vault-purple text-xl font-semibold text-white">
          {initials}
        </span>
        <div>
          <p className="text-lg font-semibold text-slate-800 dark:text-white">{user.fullName}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-soft dark:bg-vault-dark-surface">
          <p className="text-xs text-slate-400">Member since</p>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {new Date(user.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft dark:bg-vault-dark-surface">
          <p className="text-xs text-slate-400">Storage used</p>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {formatBytes(user.storageUsed)} of {formatBytes(user.storageLimit)}
          </p>
        </div>
      </div>
    </div>
  );
}
