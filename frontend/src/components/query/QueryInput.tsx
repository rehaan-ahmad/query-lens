"use client";
import React, { useState, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import VoiceInput from "./VoiceInput";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled: boolean;
}

export default function QueryInput({ onSubmit, disabled }: QueryInputProps) {
  const [text, setText] = useState("");
  const maxLength = 500;

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = text.trim();
    if (q && !disabled) {
      onSubmit(q);
      setText("");
    }
  }, [text, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Voice: stream live words into the input field
  const handleVoiceInterim = useCallback((interim: string) => {
    setText(interim.slice(0, maxLength));
  }, []);

  // Voice: auto-submit the final transcript when mic stops
  const handleVoiceFinal = useCallback((transcript: string) => {
    const q = transcript.trim().slice(0, maxLength);
    if (q && !disabled) {
      setText("");
      onSubmit(q);
    }
  }, [disabled, onSubmit]);

  return (
    <div className="w-full bg-transparent p-6 z-20 pb-8">
      <div className="max-w-4xl mx-auto relative flex items-center gap-2">
        {/* Voice mic button — positioned relative so error tooltip anchors correctly */}
        <div className="relative">
          <VoiceInput
            onInterim={handleVoiceInterim}
            onFinal={handleVoiceFinal}
            disabled={disabled}
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full"
        >
          <input
            type="text"
            className="w-full bg-surface/80 dark:bg-surface/50 backdrop-blur-md border border-black/10 dark:border-white/10 text-foreground placeholder-muted rounded-full pl-6 pr-16 py-4 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ask anything from your dataset"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus
          />
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-white p-2.5 rounded-full hover:bg-accent-glow transition-colors disabled:opacity-40 disabled:hover:bg-accent flex items-center justify-center shadow-md dark:shadow-accent/20"
          >
            {disabled ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
      <div className="max-w-4xl mx-auto flex justify-end mt-1.5 px-6">
        <span className={`text-xs font-mono font-medium ${text.length >= maxLength ? "text-red-500" : "text-muted/60"}`}>
          {text.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
