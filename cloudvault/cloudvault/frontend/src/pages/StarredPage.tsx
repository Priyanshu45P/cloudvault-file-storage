import { Star } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export default function StarredPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Starred</h1>
      <EmptyState
        icon={Star}
        title="No starred items"
        description="Mark important files or folders with a star to quickly find them here."
      />
    </div>
  );
}
