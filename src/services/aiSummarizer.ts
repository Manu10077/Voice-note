import { MoodType } from '../types/diary';

export interface DiaryAnalysis {
  suggestedTitle: string;
  suggestedMood: MoodType;
  keyPoints: string[];
  summary: string;
  tags: string[];
}

export function generateLocalInsights(transcript: string, timeOfDay: string): DiaryAnalysis {
  const clean = transcript.trim();
  if (!clean) {
    return {
      suggestedTitle: `${timeOfDay} Voice Note`,
      suggestedMood: 'peaceful',
      keyPoints: ['Voice recording with no speech detected.'],
      summary: 'Short voice note recorded.',
      tags: ['Voice Note'],
    };
  }

  // 1. Mood sentiment matching
  const lower = clean.toLowerCase();
  let suggestedMood: MoodType = 'neutral';

  const moodKeywords: Record<MoodType, string[]> = {
    grateful: ['grateful', 'thankful', 'blessed', 'appreciate', 'kindness', 'gratitude', 'lucky'],
    happy: ['happy', 'great', 'excited', 'awesome', 'wonderful', 'joy', 'smile', 'fun', 'loved', 'delighted'],
    energetic: ['productive', 'workout', 'running', 'progress', 'crushed', 'active', 'finished', 'motivated'],
    peaceful: ['peaceful', 'calm', 'relax', 'quiet', 'rest', 'breeze', 'smooth', 'comfortable', 'content'],
    thoughtful: ['thinking', 'wondering', 'reflecting', 'learned', 'idea', 'realized', 'perspective', 'future'],
    tired: ['tired', 'sleepy', 'exhausted', 'drained', 'long day', 'hard to focus', 'need sleep', 'bed'],
    stressed: ['stressed', 'overwhelmed', 'anxious', 'worried', 'hectic', 'busy', 'pressure', 'tight deadline', 'frustrated'],
    neutral: ['today', 'recorded', 'happened', 'went'],
  };

  let maxMatches = 0;
  for (const [mood, words] of Object.entries(moodKeywords)) {
    const matches = words.filter((w) => lower.includes(w)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      suggestedMood = mood as MoodType;
    }
  }

  // 2. Generate title
  let suggestedTitle = '';
  // Split into sentences
  const sentences = clean
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    if (firstSentence.length <= 40) {
      suggestedTitle = firstSentence;
    } else {
      // Pick first 5-7 words
      suggestedTitle = firstSentence.split(' ').slice(0, 6).join(' ') + '...';
    }
  } else {
    suggestedTitle = `${timeOfDay} Reflection`;
  }

  // 3. Extract key highlights
  const keyPoints: string[] = [];
  if (sentences.length >= 2) {
    keyPoints.push(...sentences.slice(0, 3));
  } else if (sentences.length === 1) {
    keyPoints.push(sentences[0]);
  } else {
    keyPoints.push(clean.slice(0, 100));
  }

  // 4. Extract simple tags
  const tags: string[] = [timeOfDay];
  if (lower.includes('work') || lower.includes('project') || lower.includes('office')) tags.push('Work');
  if (lower.includes('family') || lower.includes('friend') || lower.includes('mom') || lower.includes('dad')) tags.push('Relationships');
  if (lower.includes('health') || lower.includes('gym') || lower.includes('food') || lower.includes('sleep')) tags.push('Wellness');
  if (lower.includes('goal') || lower.includes('plan') || lower.includes('tomorrow')) tags.push('Planning');

  return {
    suggestedTitle: capitalize(suggestedTitle),
    suggestedMood,
    keyPoints,
    summary: sentences.length > 0 ? sentences.slice(0, 2).join('. ') + '.' : clean,
    tags,
  };
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

