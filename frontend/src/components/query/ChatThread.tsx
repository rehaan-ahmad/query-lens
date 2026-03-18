"use client";
import React, { useRef, useEffect } from "react";
import ChartRouter from "@/components/charts/ChartRouter";
import { QueryResponseData } from "@/hooks/useQuery";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  queryData?: QueryResponseData;
  timestamp: Date;
};

interface ChatThreadProps {
  messages: ChatMessage[];
  loading: boolean;
}

export default function ChatThread({ messages, loading }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
        <div className="w-24 h-24 mb-6 text-foreground/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </div>
        <h2 className="font-sans font-light text-2xl">No Insight Active</h2>
        <p className="mt-2 text-sm max-w-xs">Ask a question below to generate a visualization from your dataset.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" ? (
            /* User message: right-aligned bubble */
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-accent text-white px-5 py-3 rounded-2xl rounded-br-md shadow-md">
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ) : (
            /* Assistant message: left-aligned card with optional chart */
            <div className="flex justify-start">
              <div className="max-w-[95%] w-full space-y-4">
                {/* Explanation text */}
                {msg.content && (
                  <div className="bg-surface/50 dark:bg-surface/30 border border-black/5 dark:border-white/5 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm backdrop-blur-sm">
                    <div className="flex items-center mb-2">
                      <span className="w-2 h-2 rounded-full bg-accent mr-2" />
                      <span className="text-xs font-mono text-muted uppercase tracking-wider">QueryLens AI</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{msg.content}</p>
                  </div>
                )}

                {/* Inline chart */}
                {msg.queryData && msg.queryData.chart_type && msg.queryData.chart_type !== "cannot_answer" && msg.queryData.data && (
                  <div className="bg-surface rounded-2xl p-5 shadow-sm border border-black/5 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-mono text-muted uppercase tracking-wider">
                        <span className="capitalize text-accent font-semibold">{msg.queryData.chart_type?.replace('_', ' ')}</span>
                        {" — "}{msg.queryData.data?.length || 0} records
                      </span>
                    </div>
                    <div className="h-[350px]">
                      <ChartRouter
                        chartType={msg.queryData.chart_type}
                        data={msg.queryData.data}
                        columns={msg.queryData.columns}
                        explanation={msg.queryData.explanation}
                      />
                    </div>
                  </div>
                )}

                {/* Cannot answer state */}
                {msg.queryData?.chart_type === "cannot_answer" && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-5 py-4 rounded-2xl text-red-600 dark:text-red-400 text-sm">
                    {msg.queryData.explanation || "I could not find data to answer that question."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-start">
          <div className="bg-surface/50 dark:bg-surface/30 border border-black/5 dark:border-white/5 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.3s" }} />
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.6s" }} />
              <span className="text-xs font-mono text-muted ml-2">Thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
