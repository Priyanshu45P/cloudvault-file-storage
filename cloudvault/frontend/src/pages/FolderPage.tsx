import { useParams } from 'react-router-dom';
import { DriveBrowser } from '../components/drive/DriveBrowser';

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  if (!folderId) return null;
  return <DriveBrowser source="drive" folderId={folderId} />;
}
