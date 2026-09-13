import { useParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        My Drive <span className="mx-1">/</span> <span className="text-slate-800 dark:text-white">Folder</span>
      </nav>
      <EmptyState
        icon={FolderOpen}
        title="This folder is empty"
        description={`Nested folder browsing for folder ${folderId ?? ''} is wired up in Phase 3 of this build.`}
      />
    </div>
  );
}
