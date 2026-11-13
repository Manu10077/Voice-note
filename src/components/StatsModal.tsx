import React, { useRef, useEffect } from 'react';
import { BarChart2, X, Flame, Clock, Calendar, Heart, Award } from 'lucide-react';
import { MOODS, MoodType } from '../types/diary';
import { formatSeconds } from '../utils/date';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    totalEntries: number;
    totalSeconds: number;
    totalDays: number;
    currentStreak: number;
    moodCounts: Record<string, number>;
  };
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const r = dialog.getBoundingClientRect();
    const isOutside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (isOutside) {
      onClose();
    }
  };

  const totalMinutes = Math.round(stats.totalSeconds / 60);

  return (
    <dialog
      ref={dialogRef}
      onMouseDown={handleBackdropClick}
      aria-labelledby="stats-modal-title"
      className="p-0 rounded-3xl max-w-md w-[92vw] shadow-2xl bg-white dark:bg-stone-900 border border-diary-200 dark:border-stone-800 backdrop:bg-stone-950/60 backdrop:backdrop-blur-sm transition-all focus:outline-none"
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-diary-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 id="stats-modal-title" className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
              Diary Insights & Stats
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            aria-label="Close stats"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Current Streak</span>
            </div>
            <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {stats.currentStreak} <span className="text-xs font-sans font-normal text-stone-500">days</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-diary-100/60 dark:bg-stone-800/40 border border-diary-200 dark:border-stone-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <Award className="w-4 h-4 text-stone-500" />
              <span>Voice Entries</span>
            </div>
            <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {stats.totalEntries}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-diary-100/60 dark:bg-stone-800/40 border border-diary-200 dark:border-stone-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <Clock className="w-4 h-4 text-stone-500" />
              <span>Time Spoken</span>
            </div>
            <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {totalMinutes} <span className="text-xs font-sans font-normal text-stone-500">mins</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-diary-100/60 dark:bg-stone-800/40 border border-diary-200 dark:border-stone-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <Calendar className="w-4 h-4 text-stone-500" />
              <span>Active Days</span>
            </div>
            <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {stats.totalDays}
            </div>
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Mood Distribution
          </h3>
          <div className="space-y-2">
            {Object.entries(MOODS).map(([key, meta]) => {
              const count = stats.moodCounts[key] || 0;
              const percent = stats.totalEntries > 0 ? Math.round((count / stats.totalEntries) * 100) : 0;
              if (count === 0 && stats.totalEntries > 0) return null;

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300 font-medium">
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-stone-500">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-diary-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 dark:bg-amber-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Closing Thought */}
        <div className="p-3 bg-amber-50/70 dark:bg-stone-950/60 rounded-xl border border-amber-200/50 dark:border-stone-800 text-xs font-serif italic text-stone-600 dark:text-stone-400 text-center">
          "Speaking your daily thoughts clears your mind and preserves memories that text alone cannot capture."
        </div>
      </div>
    </dialog>
  );
};

