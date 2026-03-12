"use client";
import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled: boolean;
}

export default function QueryInput({ onSubmit, disabled }: QueryInputProps) {
  const [text, setText] = useState("");
  const maxLength = 500;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = text.trim();
    if (q && !disabled) {
      onSubmit(q);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full bg-surface border-t border-muted/20 p-4 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)] z-20">
      <div className="max-w-4xl mx-auto relative flex items-center">
        <form onSubmit={handleSubmit} className="w-full relative">
          <input
            type="text"
            className="w-full bg-cream border border-muted/30 text-ink placeholder-muted/80 rounded-full pl-6 pr-16 py-4 focus:outline-none focus:ring-2 focus:ring-olive/50 focus:border-olive/50 transition-all text-lg shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ask anything about the BMW inventory..."
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus
          />
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-navy text-white p-2.5 rounded-full hover:bg-olive transition-colors disabled:opacity-40 disabled:hover:bg-navy flex items-center justify-center shadow-md"
          >
            {disabled ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
      <div className="max-w-4xl mx-auto flex justify-end mt-1.5 px-6">
        <span className={`text-xs font-mono font-medium ${text.length >= maxLength ? 'text-red-500' : 'text-muted/60'}`}>
          {text.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
