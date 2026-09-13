import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, FolderPlus, Upload, LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const newMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close open menus on outside click.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/drive?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const initials = user?.fullName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-16 items-center gap-3 border-b border-slate-100 bg-white px-4 dark:border-slate-800 dark:bg-vault-dark-surface">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files and folders in CloudVault"
            aria-label="Search"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-vault-sky focus:ring-1 focus:ring-vault-sky dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {/* New button with dropdown for upload / folder creation */}
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={() => setIsNewMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-vault-deep px-3.5 py-2.5 text-sm font-medium text-white hover:bg-vault-blue"
            aria-haspopup="menu"
            aria-expanded={isNewMenuOpen}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          {isNewMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card dark:border-slate-700 dark:bg-vault-dark-surface"
            >
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setIsNewMenuOpen(false)}
              >
                <Upload className="h-4 w-4" /> Upload files
              </button>
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setIsNewMenuOpen(false)}
              >
                <FolderPlus className="h-4 w-4" /> New folder
              </button>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-vault-purple text-xs font-semibold text-white">
              {initials}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {isProfileMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-1.5 shadow-card dark:border-slate-700 dark:bg-vault-dark-surface"
            >
              <div className="px-3 py-2 text-sm">
                <p className="font-medium text-slate-800 dark:text-white">{user?.fullName}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <hr className="my-1 border-slate-100 dark:border-slate-700" />
              <button
                role="menuitem"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <UserIcon className="h-4 w-4" /> Profile
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <hr className="my-1 border-slate-100 dark:border-slate-700" />
              <button
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
