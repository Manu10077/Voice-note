// Speech Recognition helper using Web Speech API

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [subIndex: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): WebSpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): WebSpeechRecognition;
    };
  }
}

export class LiveSpeechRecognizer {
  private recognition: WebSpeechRecognition | null = null;
  private isListening = false;
  private finalTranscript = '';
  private onTranscriptUpdate?: (transcript: string, interim: string) => void;
  private onErrorCallback?: (err: string) => void;
  private restartTimeout: number | null = null;
  private shouldKeepListening = false;

  constructor() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  public static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(
    onUpdate: (transcript: string, interim: string) => void,
    onError?: (err: string) => void
  ) {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser. You can still type your notes.');
      return;
    }

    this.onTranscriptUpdate = onUpdate;
    this.onErrorCallback = onError;
    this.finalTranscript = '';
    this.shouldKeepListening = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      this.onTranscriptUpdate?.(this.finalTranscript.trim(), interimTranscript.trim());
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition warning/error:', event.error);
      if (event.error === 'not-allowed') {
        this.shouldKeepListening = false;
        this.onErrorCallback?.('Microphone access was denied for speech-to-text.');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Chrome sometimes automatically stops speech recognition after silence; auto-restart if still active
      if (this.shouldKeepListening) {
        this.restartTimeout = window.setTimeout(() => {
          try {
            if (this.shouldKeepListening && this.recognition) {
              this.recognition.start();
              this.isListening = true;
            }
          } catch {
            // Already started or busy
          }
        }, 300);
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err: unknown) {
      console.warn('Failed to start speech recognition:', err);
    }
  }

  public stop(): string {
    this.shouldKeepListening = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
      this.isListening = false;
    }
    return this.finalTranscript.trim();
  }
}

