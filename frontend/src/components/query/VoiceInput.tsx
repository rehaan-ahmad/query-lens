"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Browser SpeechRecognition API — no external library needed
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
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
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

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Guard against double-start: track actual running state in a ref (not React state)
  const isRunningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setSupported(true);
      const r = new SpeechRecognitionCtor();
      r.lang = "en-US";
      r.interimResults = false;
      r.maxAlternatives = 1;
      recognitionRef.current = r;
    }
    // Cleanup: abort on unmount
    return () => {
      if (isRunningRef.current && recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || disabled || isRunningRef.current) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = () => {
      isRunningRef.current = false;
      setListening(false);
    };

    recognition.onend = () => {
      isRunningRef.current = false;
      setListening(false);
    };

    try {
      recognition.start();
      isRunningRef.current = true;
      setListening(true);
    } catch {
      // Already started — ignore
      isRunningRef.current = false;
      setListening(false);
    }
  }, [onTranscript, disabled]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isRunningRef.current) return;
    recognition.stop();
    // State will be updated by the onend callback
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      title={listening ? "Stop listening" : "Ask with voice"}
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
