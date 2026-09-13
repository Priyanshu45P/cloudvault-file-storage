import { DriveBrowser } from '../components/drive/DriveBrowser';
export default function RecentPage() { return <div className="flex flex-col gap-4"><h1 className="text-xl font-semibold text-slate-800 dark:text-white">Recent</h1><DriveBrowser source="recent" /></div>; }
