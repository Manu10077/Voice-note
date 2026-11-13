import React, { useRef, useEffect, useState } from 'react';
import { Search as SearchIcon, X, Calendar, Play, Volume2 } from 'lucide-react';
import { DiaryEntry, MOODS } from '../types/diary';
import { searchEntries } from '../services/db';
import { formatDisplayDate, formatSeconds } from '../utils/date';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  onSelectDate,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiaryEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const matches = await searchEntries(query);
        setResults(matches);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const r = dialog.getBoundingClientRect();
    const isOutside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (isOutside) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onMouseDown={handleBackdropClick}
      aria-labelledby="search-modal-title"
      className="p-0 rounded-3xl max-w-xl w-[92vw] shadow-2xl bg-white dark:bg-stone-900 border border-diary-200 dark:border-stone-800 backdrop:bg-stone-950/60 backdrop:backdrop-blur-sm transition-all focus:outline-none"
    >
      <div className="p-6 space-y-4">
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <SearchIcon className="w-5 h-5 absolute left-3.5 text-stone-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcripts, thoughts, keywords, moods..."
            className="w-full text-sm pl-11 pr-10 py-3 rounded-2xl bg-diary-50 dark:bg-stone-950 border border-diary-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {query.trim() && results.length === 0 && !isSearching && (
            <div className="text-center py-8 text-stone-500 text-xs font-sans">
              No voice recordings match "{query}".
            </div>
          )}

          {results.map((entry) => {
            const mood = MOODS[entry.mood] || MOODS.neutral;
            return (
              <div
                key={entry.id}
                onClick={() => {
                  onSelectDate(entry.date);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-diary-50/50 dark:bg-stone-950/40 border border-diary-200/60 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {formatDisplayDate(entry.date)}
                    </span>
                    <span>•</span>
                    <span>{entry.time}</span>
                    <span>•</span>
                    <span>{mood.emoji} {mood.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    {formatSeconds(entry.duration)}
                  </span>
                </div>

                <h4 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {entry.title}
                </h4>

                <p className="text-xs font-serif text-stone-600 dark:text-stone-400 line-clamp-2 italic">
                  "{entry.transcript}"
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </dialog>
  );
};

