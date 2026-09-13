import { useParams } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

export default function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-vault-bg px-4 dark:bg-vault-dark-bg">
      <Logo size={36} />
      <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-card dark:bg-vault-dark-surface">
        <Link2 className="h-8 w-8 text-vault-sky" />
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Shared link</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Public share-link resolution for token{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
            {shareToken}
          </code>{' '}
          is wired up in Phase 5, including expiration and password protection checks.
        </p>
      </div>
    </div>
  );
}
