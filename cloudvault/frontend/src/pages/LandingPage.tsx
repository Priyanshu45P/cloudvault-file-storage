import { Link } from 'react-router-dom';
import { ShieldCheck, FolderTree, Share2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vault-bg dark:bg-vault-dark-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo size={32} />
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-vault-deep dark:text-white sm:text-5xl">
          Store, organise and share <span className="text-vault-purple">securely.</span>
        </h1>
        <p className="max-w-xl text-lg text-slate-500 dark:text-slate-400">
          CloudVault is a private cloud drive for your files and folders — fast uploads, nested
          folders, granular sharing permissions, and 5 GB of storage free.
        </p>
        <div className="flex gap-3">
          <Link to="/register">
            <Button className="px-6 py-3 text-base">Create your free account</Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: FolderTree, title: 'Nested folders', desc: 'Organise files exactly how you think.' },
            { icon: ShieldCheck, title: 'Private by default', desc: 'Only you can see your files unless you share them.' },
            { icon: Share2, title: 'Granular sharing', desc: 'Viewer or editor access, with expiring links.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl bg-white p-6 text-left shadow-soft dark:bg-vault-dark-surface">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-vault-deep/10 dark:bg-vault-sky/10">
                <Icon className="h-5 w-5 text-vault-deep dark:text-vault-sky" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
