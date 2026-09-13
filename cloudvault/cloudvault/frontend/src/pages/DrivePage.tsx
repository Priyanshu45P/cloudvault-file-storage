import { HardDrive } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export default function DrivePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">My Drive</h1>
      </div>
      <EmptyState
        icon={HardDrive}
        title="Your drive is empty"
        description="Upload files or create a folder to get started. File and folder management is wired up in Phase 2 of this build."
      />
    </div>
  );
}
