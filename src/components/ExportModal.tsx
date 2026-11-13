import React, { useRef, useEffect, useState } from 'react';
import { Download, Upload, X, Shield, Check, AlertCircle } from 'lucide-react';
import { getAllEntries, saveEntry } from '../services/db';
import { DiaryEntry } from '../types/diary';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setStatusMsg(null);
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleExportJSON = async () => {
    try {
      const all = await getAllEntries();
      // Prepare metadata and base64 audio
      const exportData = await Promise.all(
        all.map(async (entry) => {
          let base64Audio = '';
          if (entry.audioBlob) {
            base64Audio = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(entry.audioBlob);
            });
          }
          return {
            ...entry,
            audioDataUrl: base64Audio,
            audioBlob: undefined, // omitted in raw json
          };
        })
      );

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-diary-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMsg('Backup downloaded successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      setStatusMsg('Export failed. Please try again.');
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: expected array of entries.');
      }

      for (const item of imported) {
        let blob = item.audioBlob;
        if (item.audioDataUrl) {
          const res = await fetch(item.audioDataUrl);
          blob = await res.blob();
        }

        const entry: DiaryEntry = {
          id: item.id || `entry_${Date.now()}`,
          date: item.date,
          time: item.time || '12:00 PM',
          createdAt: item.createdAt || Date.now(),
          title: item.title || 'Imported Entry',
          category: item.category || 'General',
          mood: item.mood || 'neutral',
          audioBlob: blob,
          audioMimeType: item.audioMimeType || 'audio/webm',
          duration: item.duration || 0,
          transcript: item.transcript || '',
          summary: item.summary,
          keyPoints: item.keyPoints,
          tags: item.tags || [],
        };

        await saveEntry(entry);
      }

      setStatusMsg(`Successfully restored ${imported.length} entries!`);
      onRefresh();
    } catch (err: unknown) {
      console.error('Import error:', err);
      setStatusMsg('Failed to import backup file. Ensure it is a valid Voice Diary JSON file.');
    }
  };

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
      aria-labelledby="export-modal-title"
      className="p-0 rounded-3xl max-w-md w-[92vw] shadow-2xl bg-white dark:bg-stone-900 border border-diary-200 dark:border-stone-800 backdrop:bg-stone-950/60 backdrop:backdrop-blur-sm transition-all focus:outline-none"
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-diary-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <h2 id="export-modal-title" className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
              Backup & Privacy
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            aria-label="Close backup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 bg-diary-100/60 dark:bg-stone-800/40 rounded-2xl border border-diary-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          <p>
            🔒 <strong>100% Private & Local:</strong> Your voice recordings, transcripts, and diary entries are saved securely in your browser's local IndexedDB. Nothing is ever sent to external servers without your permission.
          </p>
        </div>

        {statusMsg && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Export / Import Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="w-full py-3 px-4 rounded-2xl bg-stone-900 dark:bg-diary-100 text-white dark:text-stone-900 font-medium text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-stone-800 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Complete Diary Backup (.json)</span>
          </button>

          <label className="w-full py-3 px-4 rounded-2xl border border-diary-300 dark:border-stone-700 hover:bg-diary-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>Restore From Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </dialog>
  );
};

