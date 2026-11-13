export type MoodType = 
  | 'peaceful'
  | 'happy'
  | 'grateful'
  | 'thoughtful'
  | 'energetic'
  | 'tired'
  | 'stressed'
  | 'neutral';

export interface MoodMeta {
  id: MoodType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export const MOODS: Record<MoodType, MoodMeta> = {
  peaceful: { id: 'peaceful', label: 'Peaceful', emoji: '😌', color: 'text-teal-700 dark:text-teal-300', bgColor: 'bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-800' },
  happy: { id: 'happy', label: 'Happy', emoji: '😊', color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800' },
  grateful: { id: 'grateful', label: 'Grateful', emoji: '🙏', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' },
  thoughtful: { id: 'thoughtful', label: 'Reflective', emoji: '🤔', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800' },
  energetic: { id: 'energetic', label: 'Energetic', emoji: '⚡', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800' },
  tired: { id: 'tired', label: 'Tired', emoji: '🥱', color: 'text-slate-700 dark:text-slate-300', bgColor: 'bg-slate-100 border-slate-300 dark:bg-slate-900 dark:border-slate-800' },
  stressed: { id: 'stressed', label: 'Overwhelmed', emoji: '😣', color: 'text-rose-700 dark:text-rose-300', bgColor: 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800' },
  neutral: { id: 'neutral', label: 'Normal', emoji: '😐', color: 'text-stone-700 dark:text-stone-300', bgColor: 'bg-stone-100 border-stone-200 dark:bg-stone-900 dark:border-stone-800' },
};

export type CategoryType = 
  | 'General'
  | 'Morning Thought'
  | 'Daily Win'
  | 'Gratitude'
  | 'Work & Projects'
  | 'Personal Life'
  | 'Evening Reflection'
  | 'Random Idea';

export const CATEGORIES: CategoryType[] = [
  'General',
  'Morning Thought',
  'Daily Win',
  'Gratitude',
  'Work & Projects',
  'Personal Life',
  'Evening Reflection',
  'Random Idea',
];

export interface DiaryEntry {
  id: string;
  date: string; // Format: 'YYYY-MM-DD'
  time: string; // Format: 'HH:mm'
  createdAt: number; // Unix timestamp
  title: string;
  category: CategoryType;
  mood: MoodType;
  audioBlob: Blob;
  audioMimeType: string;
  duration: number; // in seconds
  transcript: string;
  summary?: string;
  keyPoints?: string[];
  tags: string[];
}

export interface DaySummary {
  date: string;
  entryCount: number;
  totalDuration: number;
  moods: MoodType[];
}

