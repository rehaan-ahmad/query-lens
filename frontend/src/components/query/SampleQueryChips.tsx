"use client";
import React from "react";
import { Sparkles } from "lucide-react";

const SAMPLE_QUERIES = [
  "Average price by fuel type",
  "Top 10 most expensive models",
  "Mileage trend for diesel cars",
  "Count of vehicles by transmission",
];

interface SampleQueryChipsProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export default function SampleQueryChips({ onSelect, disabled }: SampleQueryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1">
      <div className="flex items-center gap-1 text-[10px] font-mono text-muted/70 mr-1 flex-shrink-0">
        <Sparkles className="w-3 h-3" />
        <span className="uppercase tracking-wider">Try asking</span>
      </div>
      {SAMPLE_QUERIES.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-surface/60 text-muted hover:text-foreground hover:border-accent/40 hover:bg-surface transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed truncate max-w-[200px]"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
