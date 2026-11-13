import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  RotateCcw, 
  X, 
  Sparkles, 
  Check, 
  Radio, 
  Volume2,
  Calendar,
  Clock
} from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { LiveSpeechRecognizer } from '../services/speechRecognition';
import { generateLocalInsights } from '../services/aiSummarizer';
import { DiaryEntry, MOODS, MoodType, CATEGORIES, CategoryType } from '../types/diary';
import { formatSeconds, getCurrentTimeString, getTimeOfDay, formatDisplayDate } from '../utils/date';

interface RecordModalProps {
  isOpen: boolean;
  selectedDate: string;
  onClose: () => void;
  onSave: (entry: DiaryEntry) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  selectedDate,
  onClose,
  onSave,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const speechRecognizerRef = useRef<LiveSpeechRecognizer | null>(null);

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    audioLevels,
    error: recorderError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  // Recording State & Metadata
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Evening Reflection');
  const [mood, setMood] = useState<MoodType>('peaceful');
  const [tags, setTags] = useState<string[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [step, setStep] = useState<'record' | 'review'>('record');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  // Initialize Speech Recognizer
  useEffect(() => {
    setIsSpeechSupported(LiveSpeechRecognizer.isSupported());
    speechRecognizerRef.current = new LiveSpeechRecognizer();
  }, []);

  // Sync native <dialog> with isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        resetForm();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const resetForm = () => {
    cancelRecording();
    setRecordedBlob(null);
    setDuration(0);
    setLiveTranscript('');
    setInterimText('');
    setStep('record');
    const timeOfDay = getTimeOfDay();
    setCategory(timeOfDay === 'Morning' ? 'Morning Thought' : 'Evening Reflection');
    setMood('peaceful');
    setTitle(`${timeOfDay} Voice Note - ${getCurrentTimeString()}`);
    setTags([timeOfDay]);
    setKeyPoints([]);
    setSummary('');
  };

  const handleStart = async () => {
    setLiveTranscript('');
    setInterimText('');
    await startRecording();

    if (speechRecognizerRef.current) {
      speechRecognizerRef.current.start((finalText, interim) => {
        setLiveTranscript(finalText);
        setInterimText(interim);
      });
    }
  };

  const handlePause = () => {
    pauseRecording();
  };

  const handleResume = () => {
    resumeRecording();
  };

  const handleFinishRecording = async () => {
    const finalSpeech = speechRecognizerRef.current?.stop() || liveTranscript;
    const blob = await stopRecording();
    const finalDuration = recordingTime;

    if (blob) {
      setRecordedBlob(blob);
      setDuration(finalDuration);

      // Auto-analyze transcript for title, mood and key insights
      const timeOfDay = getTimeOfDay();
      const insights = generateLocalInsights(finalSpeech, timeOfDay);

      setTitle(insights.suggestedTitle || `${timeOfDay} Voice Note`);
      setMood(insights.suggestedMood);
      setKeyPoints(insights.keyPoints);
      setSummary(insights.summary);
      setTags(insights.tags);
      setLiveTranscript(finalSpeech);
      setStep('review');
    }
  };

  const handleCancel = () => {
    speechRecognizerRef.current?.stop();
    cancelRecording();
    onClose();
  };

  const handleSave = () => {
    if (!recordedBlob) return;

    const newEntry: DiaryEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: selectedDate,
      time: getCurrentTimeString(),
      createdAt: Date.now(),
      title: title.trim() || 'Untitled Voice Note',
      category,
      mood,
      audioBlob: recordedBlob,
      audioMimeType: recordedBlob.type || 'audio/webm',
      duration,
      transcript: liveTranscript.trim() || 'Voice recording',
      summary,
      keyPoints,
      tags,
    };

    onSave(newEntry);
    onClose();
  };

  // Light dismiss on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const r = dialog.getBoundingClientRect();
    const isOutside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (isOutside && !isRecording) {
      handleCancel();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onMouseDown={handleBackdropClick}
      aria-labelledby="record-modal-title"
      className="p-0 rounded-3xl max-w-xl w-[92vw] shadow-2xl bg-white dark:bg-stone-900 border border-diary-200 dark:border-stone-800 backdrop:bg-stone-950/60 backdrop:backdrop-blur-sm transition-all focus:outline-none"
    >
      <div className="p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-diary-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 id="record-modal-title" className="text-lg font-serif font-semibold text-stone-900 dark:text-stone-100">
                {step === 'record' ? 'Record Voice Entry' : 'Review & Save Entry'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDisplayDate(selectedDate)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getCurrentTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={isRecording}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {recorderError && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {recorderError}
          </div>
        )}

        {/* STEP 1: RECORDING STUDIO */}
        {step === 'record' && (
          <div className="space-y-6 text-center">
            {/* Visualizer Waveform & Timer */}
            <div className="py-6 px-4 bg-diary-50/60 dark:bg-stone-950/60 rounded-2xl border border-diary-200/60 dark:border-stone-800 flex flex-col items-center justify-center space-y-4">
              {/* Timer Display */}
              <div className="font-mono text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {formatSeconds(recordingTime)}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-xs font-medium">
                {isRecording ? (
                  isPaused ? (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Paused
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Listening & Recording...
                    </span>
                  )
                ) : (
                  <span className="text-stone-500">Ready to record today's reflection</span>
                )}
              </div>

              {/* Animated Waveform Bars */}
              <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-xs px-2">
                {audioLevels.map((lvl, index) => (
                  <div
                    key={index}
                    className={`w-2.5 rounded-full transition-all duration-75 ${
                      isRecording && !isPaused
                        ? 'bg-amber-600 dark:bg-amber-500'
                        : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                    style={{
                      height: `${Math.max(12, Math.min(100, lvl * 100))}%`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Live Speech Recognition Transcript Box */}
            <div className="text-left bg-white dark:bg-stone-900 border border-diary-200 dark:border-stone-800 rounded-xl p-4 min-h-[90px] max-h-36 overflow-y-auto shadow-inner">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Live Transcription
                </span>
                {!isSpeechSupported && (
                  <span className="text-[11px] text-amber-600">Web speech not available</span>
                )}
              </div>
              <p className="text-sm font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                {liveTranscript}
                <span className="text-stone-400 dark:text-stone-500 italic">
                  {interimText}
                </span>
                {!liveTranscript && !interimText && (
                  <span className="text-stone-400 dark:text-stone-500 italic font-sans text-xs">
                    {isRecording
                      ? 'Speak naturally, your words will appear here...'
                      : 'Press Start Recording and talk about your day...'}
                  </span>
                )}
              </p>
            </div>

            {/* Recording Action Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="px-8 py-3.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm flex items-center gap-2.5 shadow-lg shadow-amber-600/25 active:scale-95 transition-all"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={handleResume}
                      className="p-3.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors"
                      title="Resume"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePause}
                      className="p-3.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition-colors"
                      title="Pause"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleFinishRecording}
                    className="px-6 py-3.5 rounded-full bg-stone-900 dark:bg-diary-100 text-white dark:text-stone-900 font-medium text-sm flex items-center gap-2 shadow-md hover:bg-stone-800 active:scale-95 transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Finish & Review
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW & METADATA */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Audio Preview Player */}
            {audioUrl && (
              <div className="bg-diary-50 dark:bg-stone-950/60 p-3 rounded-2xl border border-diary-200 dark:border-stone-800 flex items-center gap-3">
                <audio controls src={audioUrl} className="w-full h-10 accent-amber-600" />
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Entry Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Great progress on the project"
                className="w-full text-sm font-serif px-3.5 py-2.5 rounded-xl border border-diary-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Category Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      category === cat
                        ? 'bg-amber-600 border-amber-600 text-white font-medium'
                        : 'bg-white dark:bg-stone-800 border-diary-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-diary-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                How did you feel?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(MOODS).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs text-left transition-all ${
                      mood === m.id
                        ? `${m.bgColor} font-semibold ring-2 ring-amber-500/40`
                        : 'bg-white dark:bg-stone-800 border-diary-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-diary-50'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span className="truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript Preview / Edit */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>Transcript</span>
                <span className="text-[11px] font-normal text-stone-400">You can edit this</span>
              </label>
              <textarea
                value={liveTranscript}
                onChange={(e) => setLiveTranscript(e.target.value)}
                rows={3}
                className="w-full text-xs font-serif p-3 rounded-xl border border-diary-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="Voice notes will be transcribed here..."
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-diary-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setStep('record')}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Re-record
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Save to Diary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};

