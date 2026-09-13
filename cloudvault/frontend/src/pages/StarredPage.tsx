import { DriveBrowser } from '../components/drive/DriveBrowser';
export default function StarredPage() { return <div className="flex flex-col gap-4"><h1 className="text-xl font-semibold text-slate-800 dark:text-white">Starred</h1><DriveBrowser source="starred" /></div>; }
