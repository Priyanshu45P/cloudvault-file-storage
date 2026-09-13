import { Trash2 } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export default function TrashPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Trash</h1>
        <Button variant="danger" disabled>
          Empty trash
        </Button>
      </div>
      <EmptyState
        icon={Trash2}
        title="Trash is empty"
        description="Deleted files and folders stay here until you restore or permanently delete them."
      />
    </div>
  );
}
