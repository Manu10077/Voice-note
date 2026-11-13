import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { getTodayDateString } from '../utils/date';

interface CalendarModalProps {
  isOpen: boolean;
  selectedDate: string;
  entriesMap: Record<string, number>;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  selectedDate,
  entriesMap,
  onClose,
  onSelectDate,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [currentYear, setCurrentYear] = useState(() => {
    return parseInt(selectedDate.split('-')[0], 10);
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    return parseInt(selectedDate.split('-')[1], 10) - 1; // 0-indexed
  });

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

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate days for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startingDayIndex = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const todayStr = getTodayDateString();

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
      aria-labelledby="calendar-modal-title"
      className="p-0 rounded-3xl max-w-md w-[92vw] shadow-2xl bg-white dark:bg-stone-900 border border-diary-200 dark:border-stone-800 backdrop:bg-stone-950/60 backdrop:backdrop-blur-sm transition-all focus:outline-none"
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-diary-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 id="calendar-modal-title" className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
              Browse Diary Calendar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            aria-label="Close calendar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-medium text-stone-800 dark:text-stone-200 text-base">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-diary-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-diary-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells before month starts */}
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const count = entriesMap[dateStr] || 0;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all text-xs font-medium ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-sm'
                    : isToday
                    ? 'bg-diary-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold'
                    : 'hover:bg-diary-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <span>{dayNum}</span>
                {count > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-white' : 'bg-amber-600 dark:bg-amber-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-diary-100 dark:border-stone-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
            <span>Days with voice recordings</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectDate(todayStr);
              onClose();
            }}
            className="text-amber-700 dark:text-amber-400 font-medium hover:underline"
          >
            Jump to Today
          </button>
        </div>
      </div>
    </dialog>
  );
};

