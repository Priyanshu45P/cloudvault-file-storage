import { Clock } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export default function RecentPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Recent</h1>
      <EmptyState
        icon={Clock}
        title="No recent activity"
        description="Files you upload, open, rename, move, download, or share will show up here, ordered by most recent activity."
      />
    </div>
  );
}
