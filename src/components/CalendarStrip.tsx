import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatDisplayDate, formatFullDate, getTodayDateString } from '../utils/date';

interface CalendarStripProps {
  selectedDate: string;
  entriesMap: Record<string, number>;
  onSelectDate: (date: string) => void;
  onOpenCalendarModal: () => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  entriesMap,
  onSelectDate,
  onOpenCalendarModal,
}) => {
  const todayStr = getTodayDateString();

  // Step 1 day backwards or forwards
  const stepDay = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    const nextStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onSelectDate(nextStr);
  };

  // Generate 7 days around selected date (3 days before, selected day, 3 days after)
  const getNearbyDays = () => {
    const days: { dateStr: string; dayNum: number; weekday: string }[] = [];
    const [y, m, d] = selectedDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);

    for (let i = -3; i <= 3; i++) {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + i);
      const str = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      days.push({
        dateStr: str,
        dayNum: dayDate.getDate(),
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dayDate),
      });
    }
    return days;
  };

  const nearbyDays = getNearbyDays();

  return (
    <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-2xl p-4 border border-diary-200 dark:border-stone-800 shadow-sm space-y-3">
      {/* Top Header: Previous/Next Day & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => stepDay(-1)}
            className="p-1.5 rounded-lg hover:bg-diary-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
                {formatDisplayDate(selectedDate)}
              </h2>
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => onSelectDate(todayStr)}
                  className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                >
                  Jump to Today
                </button>
              )}
            </div>
            <p className="text-xs text-stone-500 font-sans">
              {formatFullDate(selectedDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepDay(1)}
            className="p-1.5 rounded-lg hover:bg-diary-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={onOpenCalendarModal}
            className="p-2 rounded-xl bg-diary-100 hover:bg-diary-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-1.5 text-xs font-medium ml-1"
            title="Open Calendar"
            aria-label="Open Calendar"
          >
            <CalendarIcon className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* Date Pill Carousel */}
      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {nearbyDays.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          const isToday = item.dateStr === todayStr;
          const count = entriesMap[item.dateStr] || 0;

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelectDate(item.dateStr)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                  : isToday
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50'
                  : 'hover:bg-diary-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                {item.weekday}
              </span>
              <span className={`text-sm font-medium mt-0.5 ${isSelected ? 'font-bold' : ''}`}>
                {item.dayNum}
              </span>
              
              {/* Dot badge for entries */}
              <div className="h-2 flex items-center justify-center mt-0.5">
                {count > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-amber-600 dark:bg-amber-400'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

