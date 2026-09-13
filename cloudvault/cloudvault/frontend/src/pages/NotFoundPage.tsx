import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-vault-bg text-center dark:bg-vault-dark-bg">
      <h1 className="text-5xl font-bold text-vault-deep dark:text-white">404</h1>
      <p className="text-slate-500 dark:text-slate-400">This page doesn&apos;t exist.</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
