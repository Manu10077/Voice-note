import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  FirebaseStorage 
} from 'firebase/storage';
import { DiaryEntry } from '../types/diary';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyDwJygLd7Bj7SREeu2838sPGlEVs80dtx0",
  authDomain: "my-voice-diary-161a2.firebaseapp.com",
  projectId: "my-voice-diary-161a2",
  storageBucket: "my-voice-diary-161a2.firebasestorage.app",
  messagingSenderId: "547406256940",
  appId: "1:547406256940:web:9aa1e991367ab7a8f96a89",
};

// 1. Get Firebase configuration from environment, localStorage, or default
export function getFirebaseConfig(): FirebaseConfig | null {
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // Check localStorage if user pasted custom config directly in the web UI
  const localSaved = localStorage.getItem('voice_diary_firebase_config');
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch {
      // Ignored
    }
  }

  // Return default configured project
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  localStorage.setItem('voice_diary_firebase_config', JSON.stringify(config));
  window.location.reload();
}

export function clearFirebaseConfig() {
  localStorage.removeItem('voice_diary_firebase_config');
  window.location.reload();
}

// 2. Initialize Firebase instances conditionally
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const config = getFirebaseConfig();
if (config) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export function isFirebaseConfigured(): boolean {
  return !!(auth && firestore);
}

// 3. Authentication helpers
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please add your Firebase configuration.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function onAuthUserChanged(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// 4. Cloud Storage helpers
export async function uploadAudioToStorage(
  userId: string,
  entryId: string,
  blob: Blob
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }
  const fileExt = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const audioRef = ref(storage, `users/${userId}/audio/${entryId}.${fileExt}`);
  
  await uploadBytes(audioRef, blob, {
    contentType: blob.type || 'audio/webm',
    customMetadata: {
      userId,
      entryId,
      uploadedAt: new Date().toISOString(),
    },
  });

  return getDownloadURL(audioRef);
}

export async function deleteAudioFromStorage(userId: string, entryId: string) {
  if (!storage) return;
  try {
    const webmRef = ref(storage, `users/${userId}/audio/${entryId}.webm`);
    await deleteObject(webmRef);
  } catch {
    try {
      const mp4Ref = ref(storage, `users/${userId}/audio/${entryId}.mp4`);
      await deleteObject(mp4Ref);
    } catch {
      // Ignored if already deleted
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 5. Firestore Database helpers
export async function syncEntryToCloud(userId: string, entry: DiaryEntry): Promise<DiaryEntry> {
  if (!firestore) return entry;

  // 1. If Cloud Storage is available, try uploading audio there
  let cloudAudioUrl = entry.audioUrl;
  if (entry.audioBlob && storage && (!cloudAudioUrl || cloudAudioUrl.startsWith('blob:'))) {
    try {
      cloudAudioUrl = await uploadAudioToStorage(userId, entry.id, entry.audioBlob);
    } catch (err) {
      console.warn('Firebase Storage upload skipped/failed (Spark plan). Saving audio directly into Firestore:', err);
    }
  }

  // 2. Spark Plan Free Fallback: If Storage bucket requires Blaze plan,
  // save the audio directly as a Base64 data URL inside Firestore (up to 1MB per document)!
  if ((!cloudAudioUrl || cloudAudioUrl.startsWith('blob:')) && entry.audioBlob) {
    try {
      cloudAudioUrl = await blobToBase64(entry.audioBlob);
    } catch (err) {
      console.warn('Failed to convert audio to base64:', err);
    }
  }

  // 3. Prepare metadata
  const entryDoc = {
    id: entry.id,
    date: entry.date,
    time: entry.time,
    createdAt: entry.createdAt,
    title: entry.title,
    category: entry.category,
    mood: entry.mood,
    audioUrl: cloudAudioUrl || '',
    audioMimeType: entry.audioMimeType,
    duration: entry.duration,
    transcript: entry.transcript,
    summary: entry.summary || '',
    keyPoints: entry.keyPoints || [],
    tags: entry.tags || [],
    userId,
    updatedAt: Date.now(),
  };

  const docRef = doc(firestore, `users/${userId}/entries/${entry.id}`);
  await setDoc(docRef, entryDoc, { merge: true });

  return {
    ...entry,
    audioUrl: cloudAudioUrl,
    syncedToCloud: true,
    userId,
  };
}

export async function fetchEntriesFromCloud(userId: string): Promise<DiaryEntry[]> {
  if (!firestore) return [];

  const entriesRef = collection(firestore, `users/${userId}/entries`);
  const q = query(entriesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  const cloudEntries: DiaryEntry[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    cloudEntries.push({
      id: data.id,
      date: data.date,
      time: data.time,
      createdAt: data.createdAt,
      title: data.title,
      category: data.category,
      mood: data.mood,
      audioUrl: data.audioUrl || data.audioDataUrl || '',
      audioMimeType: data.audioMimeType || 'audio/webm',
      duration: data.duration || 0,
      transcript: data.transcript || '',
      summary: data.summary,
      keyPoints: data.keyPoints || [],
      tags: data.tags || [],
      userId: data.userId,
      syncedToCloud: true,
    });
  });

  return cloudEntries;
}

export async function deleteEntryFromCloud(userId: string, entryId: string): Promise<void> {
  if (firestore) {
    try {
      const docRef = doc(firestore, `users/${userId}/entries/${entryId}`);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Failed to delete doc from cloud:', e);
    }
  }
  await deleteAudioFromStorage(userId, entryId);
}

