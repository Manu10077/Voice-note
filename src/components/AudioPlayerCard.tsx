import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Tag as TagIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DiaryEntry, MOODS } from '../types/diary';
import { formatSeconds } from '../utils/date';

interface AudioPlayerCardProps {
  entry: DiaryEntry;
  onDelete: (id: string) => void;
  onUpdate: (entry: DiaryEntry) => void;
}

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  entry,
  onDelete,
  onUpdate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(entry.transcript);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate object URL for the audio Blob
  useEffect(() => {
    let url: string | null = null;
    if (entry.audioBlob) {
      url = URL.createObjectURL(entry.audioBlob);
      setAudioUrl(url);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [entry.audioBlob]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const dateFormatted = entry.date.replace(/-/g, '');
    a.download = `voice-diary-${dateFormatted}-${entry.id.slice(0, 6)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveTranscript = () => {
    onUpdate({
      ...entry,
      transcript: editedTranscript,
    });
    setIsEditingTranscript(false);
  };

  const moodInfo = MOODS[entry.mood] || MOODS.neutral;
  const progressPercent = entry.duration > 0 ? (currentTime / entry.duration) * 100 : 0;

  return (
    <article className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-2xl p-5 border border-diary-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Hidden native audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* Top Header: Title, Time, Mood & Category */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-diary-100 dark:bg-stone-800 text-diary-800 dark:text-diary-200 border border-diary-200 dark:border-stone-700">
              {entry.category}
            </span>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${moodInfo.bgColor} ${moodInfo.color}`}>
              {moodInfo.emoji} {moodInfo.label}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {entry.time}
            </span>
          </div>
          <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
            {entry.title}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-stone-500">
          <button
            type="button"
            onClick={handleDownload}
            title="Download Audio"
            className="p-1.5 rounded-lg hover:bg-diary-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-lg border border-rose-200 dark:border-rose-900">
              <span className="text-xs text-rose-700 dark:text-rose-300 px-1 font-medium">Delete?</span>
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                title="Confirm delete"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              title="Delete Entry"
              className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modern Audio Player Bar */}
      <div className="bg-diary-50 dark:bg-stone-950/50 rounded-xl p-3 border border-diary-200/80 dark:border-stone-800/80 mb-4">
        <div className="flex items-center gap-3">
          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-stone-900 dark:bg-diary-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-diary-200'
            }`}
            aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
          </button>

          {/* Scrubber & Time */}
          <div className="flex-1 space-y-1">
            <div className="relative flex items-center group">
              <input
                type="range"
                min="0"
                max={entry.duration || 1}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-diary-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none"
                aria-label="Audio progress scrubber"
              />
            </div>
            <div className="flex justify-between text-xs text-stone-500 font-mono">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(entry.duration)}</span>
            </div>
          </div>

          {/* Quick Rate & Volume */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              type="button"
              onClick={cyclePlaybackRate}
              className="text-xs font-mono font-medium px-2 py-1 rounded bg-white dark:bg-stone-800 border border-diary-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-diary-100 dark:hover:bg-stone-700 transition-colors"
              title="Playback speed"
            >
              {playbackRate}x
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Voice Transcript Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Voice Transcript</span>
          </div>
          {!isEditingTranscript && (
            <button
              type="button"
              onClick={() => setIsEditingTranscript(true)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {isEditingTranscript ? (
          <div className="space-y-2">
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-diary-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              rows={3}
              placeholder="Edit voice transcript..."
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditedTranscript(entry.transcript);
                  setIsEditingTranscript(false);
                }}
                className="px-3 py-1 text-xs font-medium rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTranscript}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-stone-900 dark:bg-diary-200 text-white dark:text-stone-900 hover:bg-stone-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className={`text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed italic ${
              !showFullTranscript && entry.transcript.length > 200 ? 'line-clamp-3' : ''
            }`}>
              "{entry.transcript || 'No speech recorded.'}"
            </p>
            {entry.transcript.length > 200 && (
              <button
                type="button"
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="mt-1 text-xs font-sans text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
              >
                {showFullTranscript ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Read full transcript <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>
        )}

        {/* AI Key Points if present */}
        {entry.keyPoints && entry.keyPoints.length > 0 && (
          <div className="mt-3 pt-3 border-t border-diary-100 dark:border-stone-800/80">
            <div className="flex flex-wrap gap-2">
              {entry.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-amber-50/70 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-lg border border-amber-200/50 dark:border-stone-700/50"
                >
                  • {point}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <TagIcon className="w-3 h-3 text-stone-400" />
            {entry.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/70 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

