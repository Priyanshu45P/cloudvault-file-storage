import { useParams } from 'react-router-dom';
import { DriveBrowser } from '../components/drive/DriveBrowser';

export default function SharedFolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  if (!folderId) return null;
  return <DriveBrowser source="shared-folder" folderId={folderId} />;
}
