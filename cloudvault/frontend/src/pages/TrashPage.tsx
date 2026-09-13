import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { DriveBrowser } from '../components/drive/DriveBrowser';
import { driveApi } from '../api/drive';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function TrashPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const empty = async () => {
    if (!window.confirm('Permanently delete everything in trash? This cannot be undone.')) return;
    try {
      await driveApi.emptyTrash();
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      await refreshUser();
      showToast('Trash emptied', 'success');
    } catch (error: any) { showToast(error?.response?.data?.message ?? 'Could not empty trash', 'error'); }
  };
  return <div className="flex flex-col gap-4"><div className="flex items-center justify-between"><h1 className="text-xl font-semibold text-slate-800 dark:text-white">Trash</h1><Button variant="danger" onClick={empty}>Empty trash</Button></div><DriveBrowser source="trash" /></div>;
}
