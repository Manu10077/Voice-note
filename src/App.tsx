import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Plus } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CalendarStrip } from './components/CalendarStrip';
import { DailyTimeline } from './components/DailyTimeline';
import { RecordModal } from './components/RecordModal';
import { CalendarModal } from './components/CalendarModal';
import { SearchBar } from './components/SearchBar';
import { StatsModal } from './components/StatsModal';
import { ExportModal } from './components/ExportModal';
import { DiaryEntry } from './types/diary';
import { 
  getEntriesByDate, 
  getAllEntries, 
  saveEntry, 
  deleteEntry, 
  getEntryDatesMap, 
  getDiaryStats 
} from './services/db';
import { getTodayDateString, getCurrentTimeString } from './utils/date';
import { createWelcomeAudioBlob } from './utils/audioSample';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [entriesMap, setEntriesMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalSeconds: 0,
    totalDays: 0,
    currentStreak: 0,
    moodCounts: {} as Record<string, number>,
  });

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('voice_diary_theme') === 'dark';
  });

  // Modal visibility states
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('voice_diary_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('voice_diary_theme', 'light');
    }
  }, [isDarkMode]);

  // Refresh data
  const refreshData = useCallback(async () => {
    const dayEntries = await getEntriesByDate(selectedDate);
    setEntries(dayEntries);

    const datesMap = await getEntryDatesMap();
    setEntriesMap(datesMap);

    const diaryStats = await getDiaryStats();
    setStats(diaryStats);
  }, [selectedDate]);

  // Initial load & welcome note check
  useEffect(() => {
    const initApp = async () => {
      const all = await getAllEntries();
      if (all.length === 0) {
        // Create an introductory welcome voice entry
        try {
          const chimeBlob = await createWelcomeAudioBlob();
          const welcomeEntry: DiaryEntry = {
            id: 'welcome_entry',
            date: getTodayDateString(),
            time: getCurrentTimeString(),
            createdAt: Date.now(),
            title: 'Welcome to your Voice Diary! ✨',
            category: 'Morning Thought',
            mood: 'peaceful',
            audioBlob: chimeBlob,
            audioMimeType: 'audio/wav',
            duration: 3,
            transcript: 'Welcome to your personal Voice Diary! Instead of typing, you can speak your thoughts every day. Your voice is recorded and automatically transcribed. Tap the microphone button anytime to start recording what happened today.',
            summary: 'Your journey with daily voice journaling begins here. Speak freely, reflect, and track how your days evolve.',
            keyPoints: [
              'Record multiple voice reflections throughout each day.',
              'Real-time Speech-to-Text transcribes your words automatically.',
              '100% private and stored locally on your device.',
            ],
            tags: ['Welcome', 'First Entry', 'Voice Note'],
          };
          await saveEntry(welcomeEntry);
        } catch (e) {
          console.warn('Welcome note initialization skipped:', e);
        }
      }
      refreshData();
    };

    initApp();
  }, [refreshData]);

  // Handle Save
  const handleSaveEntry = async (newEntry: DiaryEntry) => {
    await saveEntry(newEntry);
    await refreshData();
  };

  // Handle Delete
  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    await refreshData();
  };

  // Handle Update
  const handleUpdateEntry = async (updated: DiaryEntry) => {
    await saveEntry(updated);
    await refreshData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-diary-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 selection:bg-amber-200 selection:text-amber-950 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentStreak={stats.currentStreak}
        totalEntries={stats.totalEntries}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenRecord={() => setIsRecordOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Date Navigator & Strip */}
        <CalendarStrip
          selectedDate={selectedDate}
          entriesMap={entriesMap}
          onSelectDate={setSelectedDate}
          onOpenCalendarModal={() => setIsCalendarOpen(true)}
        />

        {/* Selected Day's Timeline & Recordings */}
        <DailyTimeline
          date={selectedDate}
          entries={entries}
          onOpenRecordModal={() => setIsRecordOpen(true)}
          onDeleteEntry={handleDeleteEntry}
          onUpdateEntry={handleUpdateEntry}
        />
      </main>

      {/* Floating Action Button (Mobile) */}
      <button
        type="button"
        onClick={() => setIsRecordOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/30 flex items-center justify-center active:scale-95 transition-all z-20"
        aria-label="Record voice note"
      >
        <Mic className="w-6 h-6" />
      </button>

      {/* Footer */}
      <footer className="border-t border-diary-200/60 dark:border-stone-800 py-6 text-center text-xs text-stone-400">
        <p>Voice Diary • Your private daily spoken journal</p>
      </footer>

      {/* Modals */}
      <RecordModal
        isOpen={isRecordOpen}
        selectedDate={selectedDate}
        onClose={() => setIsRecordOpen(false)}
        onSave={handleSaveEntry}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        selectedDate={selectedDate}
        entriesMap={entriesMap}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={setSelectedDate}
      />

      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectDate={setSelectedDate}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onRefresh={refreshData}
      />
    </div>
  );
}

