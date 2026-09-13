import { Users } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export default function SharedPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Shared with Me</h1>
      <EmptyState
        icon={Users}
        title="Nothing shared with you yet"
        description="Files and folders other CloudVault users share with you will appear here. Sharing ships in Phase 5."
      />
    </div>
  );
}
