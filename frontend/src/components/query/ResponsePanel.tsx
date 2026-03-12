"use client";
import React, { useEffect, useState } from "react";
import Connector from "../animation/Connector";
import ParticleField from "../animation/ParticleField";

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
        "Querying BMW inventory...",
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
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-surface border-l border-muted/20 z-10 overflow-hidden">
      
      {/* Ambient background particles during querying */}
      <ParticleField active={phase === "querying"} />

      {/* Center connector animation */}
      <div className="mb-8 z-10">
        <Connector phase={phase} />
      </div>

      {/* Content Area */}
      <div className="z-10 text-center max-w-sm w-full transition-opacity duration-1000 ease-in-out" style={{ opacity }}>
        {phase === "idle" && !explanation && !errorText && (
          <div>
            <h3 className="text-xl font-serif text-ink mb-2">QueryLens AI</h3>
            <p className="text-muted text-sm">
              I can help you explore the BMW inventory data. Start by typing a question below.
            </p>
          </div>
        )}

        {errorText && (
          <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100 shadow-sm mt-4">
            <p className="font-medium text-sm">{errorText}</p>
          </div>
        )}

        {phase === "ready" && explanation && (
          <div className="flex flex-col items-center">
            {queryEcho && (
              <p className="text-xs text-muted mb-4 uppercase tracking-wider font-mono bg-cream px-3 py-1 rounded-full inline-block">
                &quot;{queryEcho}&quot;
              </p>
            )}
            <div className="text-ink text-base md:text-lg leading-relaxed font-sans text-balance">
              {explanation}
            </div>
            <div className="mt-8 flex items-center space-x-2 text-xs text-olive font-medium bg-olive/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
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
