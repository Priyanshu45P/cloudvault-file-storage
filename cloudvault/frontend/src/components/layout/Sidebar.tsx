import { NavLink } from 'react-router-dom';
import {
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '../ui/Logo';
import { StorageIndicator } from './StorageIndicator';

const NAV_ITEMS = [
  { to: '/drive', label: 'My Drive', icon: HardDrive },
  { to: '/shared', label: 'Shared with Me', icon: Users },
  { to: '/recent', label: 'Recent', icon: Clock },
  { to: '/starred', label: 'Starred', icon: Star },
  { to: '/trash', label: 'Trash', icon: Trash2 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 border-r border-slate-100 bg-white p-4 transition-transform duration-200 dark:border-slate-800 dark:bg-vault-dark-surface md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-1">
          <Logo size={30} />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-vault-deep/10 text-vault-deep dark:bg-vault-sky/20 dark:text-vault-sky'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )
              }
            >
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <StorageIndicator />
      </aside>
    </>
  );
}
