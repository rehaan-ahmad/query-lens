"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceInputProps {
  /** Called continuously as the user speaks (interim transcript). */
  onInterim: (text: string) => void;
  /** Called once with the final transcript when mic stops — triggers query submit. */
  onFinal: (text: string) => void;
  disabled?: boolean;
}

// ─── Web Speech API types (not in all TS libs) ────────────────────────────────

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

// ─── Human-readable error labels ─────────────────────────────────────────────

const ERROR_LABELS: Record<string, string> = {
  "not-allowed":    "Microphone access denied",
  "no-speech":      "No speech detected — try again",
  "network":        "Network error — check your connection",
  "audio-capture":  "No microphone found",
  "service-not-allowed": "Speech service not allowed",
};

function getErrorLabel(code: string): string {
  return ERROR_LABELS[code] ?? "Voice input error — try again";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VoiceInput({ onInterim, onFinal, disabled }: VoiceInputProps) {
  const [listening, setListening]       = useState(false);
  const [supported, setSupported]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  // Track running state independently of React to avoid stale state in callbacks
  const isRunningRef        = useRef(false);
  // Accumulated confirmed final text across multiple `onresult` events
  const finalTranscriptRef  = useRef("");

  /**
   * Always hold the latest props in refs so that handlers attached at
   * `startListening` time (which run later, asynchronously) always call
   * the most current `onInterim` / `onFinal` — avoiding the stale-closure bug.
   */
  const onInterimRef = useRef(onInterim);
  const onFinalRef   = useRef(onFinal);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);
  useEffect(() => { onFinalRef.current   = onFinal;   }, [onFinal]);

  // SpeechRecognition constructor (set once on mount)
  const SpeechRecognitionCtorRef = useRef<(new () => SpeechRecognitionInstance) | null>(null);

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Ctor) {
      SpeechRecognitionCtorRef.current = Ctor;
      setSupported(true);
    }
  }, []);

  // Stop + abort if the host disables the input while recording
  useEffect(() => {
    if (disabled && isRunningRef.current) {
      stopListening(true /* abort — discard transcript */);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRunningRef.current && recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * A fresh instance is created per recording session to avoid the
   * "already started" DOMException that can occur on a reused instance.
   */
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    const Ctor = SpeechRecognitionCtorRef.current;
    if (!Ctor || disabled || isRunningRef.current) return;

    setErrorMsg(null);
    finalTranscriptRef.current = "";

    // Fresh instance every session — avoids DOMException on reuse
    const r = new Ctor();
    r.lang            = "en-US";
    r.interimResults  = true;  // Stream words as spoken
    r.continuous      = true;  // Keep mic open until explicitly stopped
    r.maxAlternatives = 1;
    recognitionRef.current = r;

    // Handlers reference refs — never stale, always latest props
    r.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText   = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        finalTranscriptRef.current += finalText;
      }

      // Show combined confirmed + live interim in the input field
      onInterimRef.current((finalTranscriptRef.current + interimText).trim());
    };

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      isRunningRef.current = false;
      setListening(false);
      // Clear any partial interim text from the input
      onInterimRef.current("");
      finalTranscriptRef.current = "";
      setErrorMsg(getErrorLabel(event.error));
      // Auto-clear the error message after 4 seconds
      setTimeout(() => setErrorMsg(null), 4000);
    };

    r.onend = () => {
      isRunningRef.current = false;
      setListening(false);
      // Auto-submit the accumulated transcript when mic stops
      const transcript = finalTranscriptRef.current.trim();
      if (transcript) {
        onFinalRef.current(transcript);
      }
    };

    try {
      r.start();
      isRunningRef.current = true;
      setListening(true);
    } catch {
      isRunningRef.current = false;
      setListening(false);
      setErrorMsg("Could not start microphone — please try again");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  }, [disabled]);

  /**
   * @param abort - if true, discard transcript (e.g. when host disables mid-session).
   *                if false (default), stop gracefully → triggers onend → fires onFinal.
   */
  const stopListening = useCallback((abort = false) => {
    const recognition = recognitionRef.current;
    if (!recognition || !isRunningRef.current) return;

    if (abort) {
      finalTranscriptRef.current = "";
      onInterimRef.current("");
      recognition.abort();    // onend fires but transcript is empty → no submit
    } else {
      recognition.stop();     // Graceful stop → onend → fires onFinal, auto-submits
    }
  }, []);

  if (!supported) return null;

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <button
        type="button"
        onClick={listening ? () => stopListening(false) : startListening}
        disabled={disabled}
        title={listening ? "Stop & send" : "Ask with voice"}
        aria-label={listening ? "Stop voice recording and submit" : "Start voice input"}
        className={`p-2.5 rounded-xl transition-all duration-200 border ${
          listening
            ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 animate-pulse"
            : errorMsg
            ? "bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/30"
            : "bg-surface/50 text-muted border-black/10 dark:border-white/10 hover:text-foreground hover:bg-surface hover:border-accent/30"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Error label — visible for 4 s then auto-clears */}
      {errorMsg && !listening && (
        <div
          role="alert"
          className="absolute bottom-full mb-2 left-0 flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-medium px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-500/20 whitespace-nowrap shadow-sm"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
