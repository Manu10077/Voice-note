# Voice Diary 🎙️📓

A modern, private **Daily Audio Journal** web application. Instead of typing your thoughts, speak freely about what happened today. Your voice is recorded, organized by date, and automatically transcribed into text in real-time.

---

## ✨ Features

- **Daily Voice Journaling**: Speak freely about your day — reflections, wins, ideas, or stream of consciousness.
- **Multiple Entries per Day**: Record different voice notes throughout your day (e.g. Morning thoughts, afternoon updates, evening wind-down).
- **Date-Based Organization**: Clean calendar view and horizontal timeline strip to browse past recordings by date.
- **Real-Time Speech-to-Text (Transcription)**: Utilizes the browser's native Web Speech API to transcribe your spoken words live as you record.
- **Smart Insights & Mood Tracking**:
  - Automatically suggests titles and bullet points based on your transcript.
  - Tag entries with emotions (😊 Happy, 😌 Peaceful, 🙏 Grateful, 🤔 Reflective, ⚡ Energetic, 🥱 Tired, 😣 Overwhelmed).
- **Interactive Audio Player**:
  - Waveform visualizer & scrubber
  - Playback speeds (1x, 1.25x, 1.5x, 2x)
  - Volume & mute toggle
  - Audio download (`.webm` / `.wav`)
- **100% Private & Offline-First**:
  - Stored locally on your machine via **IndexedDB** (`idb`).
  - No external server uploads required.
  - Full backup and restore (JSON export with audio).
- **Search & Insights**:
  - Instant full-text search across all voice transcripts, titles, and tags.
  - Streaks, total speaking time, and mood distribution analytics.
- **Dark Mode**: Beautiful, serene journal design in both warm paper light mode and nocturnal dark mode.

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for production
```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Local Storage**: IndexedDB (via `idb`) for client-side audio blob and metadata storage
- **Audio APIs**:
  - `MediaRecorder` API (high-fidelity audio recording)
  - `AudioContext` & `AnalyserNode` (real-time frequency visualizer)
  - Web Speech API (`SpeechRecognition`) for zero-latency live voice transcription
- **Icons**: Lucide React

