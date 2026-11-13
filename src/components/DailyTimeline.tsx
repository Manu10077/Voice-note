import React from 'react';
import { Mic, Clock, Sparkles } from 'lucide-react';
import { DiaryEntry, MOODS } from '../types/diary';
import { AudioPlayerCard } from './AudioPlayerCard';
import { formatDisplayDate, formatSeconds } from '../utils/date';

interface DailyTimelineProps {
  date: string;
  entries: DiaryEntry[];
  onOpenRecordModal: () => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: DiaryEntry) => void;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
  date,
  entries,
  onOpenRecordModal,
  onDeleteEntry,
  onUpdateEntry,
}) => {
  const totalSeconds = entries.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const displayDate = formatDisplayDate(date);

  // Collect unique moods for this day
  const recordedMoods = Array.from(new Set(entries.map((e) => e.mood)));

  return (
    <section className="space-y-4">
      {/* Day Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="space-y-0.5">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>{displayDate}'s Voice Entries</span>
            <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-diary-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {entries.length} {entries.length === 1 ? 'recording' : 'recordings'}
            </span>
          </h2>

          {entries.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatSeconds(totalSeconds)} total recorded
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span>Moods:</span>
                <span className="flex gap-1">
                  {recordedMoods.map((m) => (
                    <span key={m} title={MOODS[m]?.label}>
                      {MOODS[m]?.emoji}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Record button on top right */}
        <button
          type="button"
          onClick={onOpenRecordModal}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all active:scale-95"
        >
          <Mic className="w-4 h-4" />
          <span>Record Note</span>
        </button>
      </div>

      {/* List of Voice Recordings or Empty State */}
      {entries.length === 0 ? (
        <div className="bg-white/70 dark:bg-stone-900/70 border border-dashed border-diary-300 dark:border-stone-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Mic className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
              No voice recordings for {displayDate} yet
            </h3>
            <p className="text-xs text-stone-500 font-sans leading-relaxed">
              Take a moment to speak your mind. Share what happened today, what you learned, or a fleeting thought.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRecordModal}
            className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-amber-600/20 active:scale-95 transition-all"
          >
            <Mic className="w-4 h-4" />
            Record {displayDate}'s Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <AudioPlayerCard
              key={entry.id}
              entry={entry}
              onDelete={onDeleteEntry}
              onUpdate={onUpdateEntry}
            />
          ))}
        </div>
      )}
    </section>
  );
};

