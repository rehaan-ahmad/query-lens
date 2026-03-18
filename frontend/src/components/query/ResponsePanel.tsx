"use client";
import React, { useEffect, useState } from "react";
import Connector from "../animation/Connector";
import MetronomeBatons from "../animation/MetronomeBatons";

type Phase = "idle" | "querying" | "delivering" | "ready";

interface ResponsePanelProps {
  phase: Phase;
  queryEcho?: string;
  explanation?: string;
  errorText?: string;
}

export default function ResponsePanel({ 
  phase, 
  queryEcho, 
  explanation, 
  errorText 
}: ResponsePanelProps) {
  const [loadingText, setLoadingText] = useState("Analysing your question...");
  const [opacity, setOpacity] = useState(0);

  // Cycle loading messages when querying
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "querying") {
      const messages = [
        "Analysing your question...",
        "Generating secure SQL...",
        "Querying your data...",
        "Preparing visualisation...",
      ];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingText(messages[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Fade in explanation slowly when ready
  useEffect(() => {
    if (phase === "ready" || phase === "idle") {
      setOpacity(1);
    } else {
      setOpacity(0);
    }
  }, [phase]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-transparent z-10 overflow-hidden">
      
      {/* Ambient background particles during querying */}
      <MetronomeBatons active={phase === "querying"} />

      {/* Center connector animation */}
      <div className="mb-8 z-10">
        <Connector phase={phase} />
      </div>

      {/* Content Area */}
      <div className="z-10 text-center max-w-sm w-full transition-opacity duration-1000 ease-in-out" style={{ opacity }}>
        {phase === "idle" && !explanation && !errorText && (
          <div className="bg-surface/30 dark:bg-surface/10 p-6 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
            <h3 className="text-xl font-serif mb-2 font-semibold tracking-tight">QueryLens AI</h3>
            <p className="text-muted text-sm leading-relaxed">
              I can help you explore your data. Start by typing a question below.
            </p>
          </div>
        )}

        {errorText && (
          <div className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-4 rounded-lg border border-red-100 dark:border-red-500/20 shadow-sm mt-4 backdrop-blur-sm">
            <p className="font-medium text-sm">{errorText}</p>
          </div>
        )}

        {phase === "ready" && explanation && (
          <div className="flex flex-col items-center bg-surface/30 dark:bg-surface/10 p-6 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm shadow-sm">
            {queryEcho && (
              <p className="text-xs text-muted mb-4 uppercase tracking-wider font-mono bg-background px-3 py-1 rounded-full border border-black/5 dark:border-white/5 inline-block">
                &quot;{queryEcho}&quot;
              </p>
            )}
            <div className="text-base leading-relaxed font-sans text-balance">
              {explanation}
            </div>
            <div className="mt-8 flex items-center space-x-2 text-xs text-accent font-medium bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>Insight Generated Successfully</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading Status Text */}
      {(phase === "querying" || phase === "delivering") && (
        <div className="absolute bottom-24 z-10 text-muted font-mono text-sm tracking-wide animate-pulse">
          {phase === "delivering" ? "Finalising..." : loadingText}
        </div>
      )}
    </div>
  );
}
