import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Cloud, RefreshCw } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CalendarStrip } from './components/CalendarStrip';
import { DailyTimeline } from './components/DailyTimeline';
import { RecordModal } from './components/RecordModal';
import { CalendarModal } from './components/CalendarModal';
import { SearchBar } from './components/SearchBar';
import { StatsModal } from './components/StatsModal';
import { ExportModal } from './components/ExportModal';
import { FirebaseModal } from './components/FirebaseModal';
import { DiaryEntry } from './types/diary';
import { 
  getEntriesByDate, 
  getAllEntries, 
  saveEntry, 
  deleteEntry, 
  getEntryDatesMap, 
  getDiaryStats 
} from './services/db';
import { 
  onAuthUserChanged, 
  loginWithGoogle, 
  logoutUser, 
  isFirebaseConfigured,
  syncEntryToCloud,
  fetchEntriesFromCloud,
  deleteEntryFromCloud
} from './services/firebase';
import { User } from 'firebase/auth';
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

  // User & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

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

  // Refresh local data
  const refreshData = useCallback(async () => {
    const dayEntries = await getEntriesByDate(selectedDate);
    setEntries(dayEntries);

    const datesMap = await getEntryDatesMap();
    setEntriesMap(datesMap);

    const diaryStats = await getDiaryStats();
    setStats(diaryStats);
  }, [selectedDate]);

  // Sync from Cloud when user logs in or switches device
  const syncFromCloud = useCallback(async (activeUser: User) => {
    setIsSyncing(true);
    setSyncStatus('Syncing your cloud diary...');
    try {
      // 1. Upload any local entries that haven't been synced to cloud yet
      const localEntries = await getAllEntries();
      for (const localEntry of localEntries) {
        if (!localEntry.syncedToCloud && localEntry.id !== 'welcome_entry') {
          const synced = await syncEntryToCloud(activeUser.uid, localEntry);
          await saveEntry(synced);
        }
      }

      // 2. Fetch all entries from Firestore
      const cloudEntries = await fetchEntriesFromCloud(activeUser.uid);
      for (const entry of cloudEntries) {
        await saveEntry(entry);
      }

      setSyncStatus('Diary is up-to-date across your devices!');
      setTimeout(() => setSyncStatus(null), 3500);
      await refreshData();
    } catch (err: unknown) {
      console.warn('Sync from cloud error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('permission-denied') || errMsg.includes('Missing or insufficient permissions')) {
        setSyncStatus('Firestore permission denied: Please check and publish Firestore Rules in Firebase Console.');
      } else {
        setSyncStatus(`Cloud sync notice: ${errMsg}`);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [refreshData]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncFromCloud(currentUser);
      }
    });
    return () => unsubscribe();
  }, [syncFromCloud]);

  // Initial load & welcome note check
  useEffect(() => {
    const initApp = async () => {
      const all = await getAllEntries();
      if (all.length === 0) {
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
              '100% private and stored locally, with cloud sync across devices.',
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
    // 1. Save locally to IndexedDB first
    await saveEntry(newEntry);
    await refreshData();

    // 2. If user is signed in, sync immediately to Firestore
    if (user) {
      setSyncStatus('Uploading recording to cloud...');
      try {
        const synced = await syncEntryToCloud(user.uid, newEntry);
        await saveEntry(synced);
        await refreshData();
        setSyncStatus('Saved & Synced to Cloud! ☁️');
        setTimeout(() => setSyncStatus(null), 3000);
      } catch (err: unknown) {
        console.error('Background cloud sync failed:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('permission-denied') || errMsg.includes('Missing or insufficient permissions')) {
          setSyncStatus('Firestore permission denied: Please publish Firestore Rules in Firebase Console.');
        } else {
          setSyncStatus(`Cloud save notice: ${errMsg}`);
        }
      }
    }
  };

  // Handle Delete
  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
    await refreshData();
    if (user) {
      try {
        await deleteEntryFromCloud(user.uid, id);
      } catch (err) {
        console.warn('Failed to delete from cloud:', err);
      }
    }
  };

  // Handle Update
  const handleUpdateEntry = async (updated: DiaryEntry) => {
    await saveEntry(updated);
    await refreshData();
    if (user) {
      try {
        await syncEntryToCloud(user.uid, updated);
      } catch (err) {
        console.warn('Failed to update cloud doc:', err);
      }
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="min-h-screen flex flex-col bg-diary-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 selection:bg-amber-200 selection:text-amber-950 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentStreak={stats.currentStreak}
        totalEntries={stats.totalEntries}
        isDarkMode={isDarkMode}
        user={user}
        isFirebaseConfigured={isFirebaseConfigured()}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenRecord={() => setIsRecordOpen(true)}
      />

      {/* Cloud Sync Status Banner */}
      {(syncStatus || user) && (
        <div className="bg-amber-100/90 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-900 py-1.5 px-4 text-center text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5 text-amber-600" />}
            <span>{syncStatus || `Signed in as ${user?.displayName || user?.email}`}</span>
          </div>
          {user && !isSyncing && (
            <button
              type="button"
              onClick={() => syncFromCloud(user)}
              className="text-[11px] underline font-medium hover:text-amber-700 dark:hover:text-amber-300 ml-1"
            >
              Sync to Cloud
            </button>
          )}
        </div>
      )}

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

      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}
