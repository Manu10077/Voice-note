import React from 'react';
import { 
  BookHeart, 
  Flame, 
  Search, 
  BarChart2, 
  Moon, 
  Sun, 
  Download,
  Mic,
  Cloud,
  LogOut,
  LogIn
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentStreak: number;
  totalEntries: number;
  isDarkMode: boolean;
  user: User | null;
  isFirebaseConfigured: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenFirebaseModal: () => void;
  onToggleDarkMode: () => void;
  onOpenSearch: () => void;
  onOpenStats: () => void;
  onOpenExport: () => void;
  onOpenRecord: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStreak,
  totalEntries,
  isDarkMode,
  user,
  isFirebaseConfigured,
  onLogin,
  onLogout,
  onOpenFirebaseModal,
  onToggleDarkMode,
  onOpenSearch,
  onOpenStats,
  onOpenExport,
  onOpenRecord,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-diary-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-diary-200/80 dark:border-stone-800/80 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
            <BookHeart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              Voice Diary
            </h1>
            <p className="text-[11px] font-sans text-stone-500 dark:text-stone-400">
              Daily Audio Journal
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Streak Badge */}
          <div 
            title={`Current journaling streak: ${currentStreak} days`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-default"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span>
          </div>

          {/* Cloud Sync Button / Google User Badge */}
          {user ? (
            <div className="flex items-center gap-2 bg-diary-100 dark:bg-stone-800/80 px-2 py-1 rounded-xl border border-diary-200 dark:border-stone-700">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-diary-300 dark:border-stone-600 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-stone-700 dark:text-stone-200 hidden md:inline truncate max-w-[100px]">
                {user.displayName?.split(' ')[0] || 'Logged In'}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isFirebaseConfigured ? (
            <button
              type="button"
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-diary-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-medium hover:bg-diary-50 dark:hover:bg-stone-700 transition-all shadow-sm"
              title="Sign in with Google to sync voice notes across devices"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenFirebaseModal}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-diary-100 dark:hover:bg-stone-800 transition-colors"
              title="Setup Cross-Device Cloud Sync"
              aria-label="Setup Cloud Sync"
            >
              <Cloud className="w-4 h-4 text-stone-500" />
            </button>
          )}

          {/* Quick Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-diary-100 dark:hover:bg-stone-800 transition-colors"
            title="Search voice transcripts & tags"
            aria-label="Search diary"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Stats / Insights */}
          <button
            type="button"
            onClick={onOpenStats}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-diary-100 dark:hover:bg-stone-800 transition-colors"
            title="View Diary Insights & Statistics"
            aria-label="View statistics"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          {/* Export / Backup */}
          <button
            type="button"
            onClick={onOpenExport}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-diary-100 dark:hover:bg-stone-800 transition-colors"
            title="Export / Backup Diary"
            aria-label="Export diary"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-diary-100 dark:hover:bg-stone-800 transition-colors"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Record CTA */}
          <button
            type="button"
            onClick={onOpenRecord}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-diary-100 dark:hover:bg-diary-200 text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition-all active:scale-95 ml-1"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record</span>
          </button>
        </div>
      </div>
    </header>
  );
};
