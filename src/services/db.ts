import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DiaryEntry } from '../types/diary';

interface VoiceDiaryDB extends DBSchema {
  entries: {
    key: string;
    value: DiaryEntry;
    indexes: {
      'by-date': string;
      'by-created': number;
    };
  };
}

const DB_NAME = 'voice_diary_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VoiceDiaryDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VoiceDiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) {
          const store = db.createObjectStore('entries', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
          store.createIndex('by-created', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const db = await getDB();
  await db.put('entries', entry);
}

export async function getEntryById(id: string): Promise<DiaryEntry | undefined> {
  const db = await getDB();
  return db.get('entries', id);
}

export async function getEntriesByDate(date: string): Promise<DiaryEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('entries', 'by-date', date);
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('entries', 'by-created');
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('entries', id);
}

export async function searchEntries(query: string): Promise<DiaryEntry[]> {
  const all = await getAllEntries();
  const q = query.toLowerCase().trim();
  if (!q) return all;

  return all.filter((entry) => {
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.transcript.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.toLowerCase().includes(q)) ||
      entry.date.includes(q)
    );
  });
}

export async function getEntryDatesMap(): Promise<Record<string, number>> {
  const all = await getAllEntries();
  const map: Record<string, number> = {};
  for (const entry of all) {
    map[entry.date] = (map[entry.date] || 0) + 1;
  }
  return map;
}

export async function getDiaryStats() {
  const all = await getAllEntries();
  const totalEntries = all.length;
  const totalSeconds = all.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const uniqueDates = new Set(all.map((e) => e.date));
  const totalDays = uniqueDates.size;

  // Calculate streak
  const sortedDates = Array.from(uniqueDates).sort().reverse();
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
    let checkDate = new Date(sortedDates.includes(today) ? today : yesterday);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.has(dateStr)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  // Count moods
  const moodCounts: Record<string, number> = {};
  for (const entry of all) {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  }

  return {
    totalEntries,
    totalSeconds,
    totalDays,
    currentStreak,
    moodCounts,
  };
}

