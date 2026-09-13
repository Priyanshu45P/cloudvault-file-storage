import { useSearchParams } from 'react-router-dom';
import { DriveBrowser } from '../components/drive/DriveBrowser';

export default function DrivePage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{q ? 'Search results' : 'My Drive'}</h1>
          {q && <p className="mt-1 text-sm text-slate-500">Results for “{q}” across your drive</p>}
        </div>
      </div>
      <DriveBrowser source="drive" query={q} />
    </div>
  );
}
