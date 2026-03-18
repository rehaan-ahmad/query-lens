"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  /** Called continuously as the user speaks (interim transcript) */
  onInterim: (text: string) => void;
  /** Called once with the final transcript when mic stops — triggers query submit */
  onFinal: (text: string) => void;
  disabled?: boolean;
}

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

export default function VoiceInput({ onInterim, onFinal, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isRunningRef = useRef(false);
  // Track the latest final transcript so onend can submit it
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setSupported(true);
      const r = new SpeechRecognitionCtor();
      r.lang = "en-US";
      r.interimResults = true;   // Show words as they're spoken
      r.continuous = true;       // Keep listening until explicitly stopped
      r.maxAlternatives = 1;
      recognitionRef.current = r;
    }
    return () => {
      if (isRunningRef.current && recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || disabled || isRunningRef.current) return;

    finalTranscriptRef.current = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      // Accumulate confirmed final text
      if (finalText) {
        finalTranscriptRef.current += finalText;
      }

      // Show live text in the input field (final so far + current interim)
      onInterim((finalTranscriptRef.current + interimText).trim());
    };

    recognition.onerror = () => {
      isRunningRef.current = false;
      setListening(false);
    };

    recognition.onend = () => {
      isRunningRef.current = false;
      setListening(false);
      // Auto-submit the accumulated transcript when mic stops
      const transcript = finalTranscriptRef.current.trim();
      if (transcript) {
        onFinal(transcript);
      }
    };

    try {
      recognition.start();
      isRunningRef.current = true;
      setListening(true);
    } catch {
      isRunningRef.current = false;
      setListening(false);
    }
  }, [onInterim, onFinal, disabled]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isRunningRef.current) return;
    // stop() — triggers onend → which fires onFinal and auto-submits
    recognition.stop();
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      title={listening ? "Stop & send" : "Ask with voice"}
      className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 border ${
        listening
          ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 animate-pulse"
          : "bg-surface/50 text-muted border-black/10 dark:border-white/10 hover:text-foreground hover:bg-surface hover:border-accent/30"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
