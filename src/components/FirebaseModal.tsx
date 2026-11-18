import React, { useRef, useEffect, useState } from 'react';
import { 
  Cloud, 
  X, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Sparkles,
  Key,
  Database,
  Trash2
} from 'lucide-react';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  isFirebaseConfigured,
  FirebaseConfig 
} from '../services/firebase';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [configText, setConfigText] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setIsConfigured(isFirebaseConfigured());
  }, [isOpen]);

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

  const handleSaveConfig = () => {
    try {
      let parsed: Partial<FirebaseConfig> = {};
      const trimmed = configText.trim();

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsed = JSON.parse(trimmed);
      } else {
        // Parse loose JavaScript object: const firebaseConfig = { ... }
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (match) {
          // Convert JS object keys to valid JSON format
          const jsonLike = match[0]
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ')
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}');
          parsed = JSON.parse(jsonLike);
        } else {
          throw new Error('Please paste your full firebaseConfig object from the Firebase Console.');
        }
      }

      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Missing apiKey or projectId in the configuration.');
      }

      const completeConfig: FirebaseConfig = {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
      };

      saveFirebaseConfig(completeConfig);
      setStatusMsg({ type: 'success', text: 'Firebase successfully configured! Reloading...' });
    } catch (err: unknown) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Invalid configuration format. Please check the JSON.',
      });
    }
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect Firebase cloud sync? Your local entries will remain intact.')) {
      clearFirebaseConfig();
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
      aria-labelledby="firebase-modal-title"
      className="p-0 rounded-3xl max-w-lg w-[92vw] shadow-2xl bg-white dark:bg-stone-900 border border-diary-200 dark:border-stone-800 backdrop:bg-stone-950/60 backdrop:backdrop-blur-sm transition-all focus:outline-none"
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-diary-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 id="firebase-modal-title" className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
                Cross-Device Cloud Sync
              </h2>
              <p className="text-xs text-stone-500">
                Access your voice diary anywhere via Google Cloud / Firebase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status card */}
        {isConfigured ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <Check className="w-4 h-4" />
                <span>Firebase Connected & Active</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Disconnect
              </button>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Your voice recordings and daily reflections automatically sync to your private Google Cloud storage and Firestore when signed in.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Connect Firebase to sync between phone and computer</span>
            </div>
            <p className="text-stone-600 dark:text-stone-400">
              When Firebase is connected, you can record a voice note on your phone and immediately listen to it on your laptop!
            </p>
          </div>
        )}

        {statusMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusMsg.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {!isConfigured && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>Paste Firebase Config</span>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Open Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                rows={5}
                placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "voice-diary.firebaseapp.com",
  projectId: "voice-diary-xyz",
  storageBucket: "voice-diary.appspot.com",
  appId: "1:..."
};`}
                className="w-full text-xs font-mono p-3 rounded-xl border border-diary-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Quick 3-Step Guide */}
            <div className="bg-diary-50 dark:bg-stone-950/60 p-3.5 rounded-2xl border border-diary-200/80 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 space-y-1.5">
              <div className="font-semibold text-stone-800 dark:text-stone-200">
                Quick Setup (Free):
              </div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Create a free project at <span className="font-mono text-amber-700 dark:text-amber-400">console.firebase.google.com</span>.</li>
                <li>Enable <strong>Authentication</strong> (Google Provider), <strong>Firestore Database</strong>, and <strong>Cloud Storage</strong>.</li>
                <li>In <strong>Project Settings → General → Web App</strong>, copy your <span className="font-mono">firebaseConfig</span> and paste it above!</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Cloud className="w-4 h-4" />
              <span>Save & Connect Firebase</span>
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
