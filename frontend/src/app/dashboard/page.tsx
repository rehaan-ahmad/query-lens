"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useQuery";
import { useHistory } from "@/hooks/useHistory";
import { v4 as uuidv4 } from "uuid";
import QueryHistory from "@/components/query/QueryHistory";
import QueryInput from "@/components/query/QueryInput";
import ResponsePanel from "@/components/query/ResponsePanel";
import ChatThread, { ChatMessage } from "@/components/query/ChatThread";
import SampleQueryChips from "@/components/query/SampleQueryChips";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const { submitQuery, loading: queryLoading, error } = useQuery();
  const { history, fetchHistory, loading: historyLoading } = useHistory(sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "querying" | "delivering" | "ready">("idle");
  const [latestExplanation, setLatestExplanation] = useState<string | undefined>();

  useEffect(() => {
    let sid = sessionStorage.getItem("querylens_session");
    if (!sid) {
      sid = uuidv4();
      sessionStorage.setItem("querylens_session", sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      fetchHistory();
    }
  }, [sessionId, isAuthenticated, fetchHistory]);

  const handleQuerySubmit = useCallback(async (queryText: string) => {
    setActiveQuery(queryText);
    setPhase("querying");
    setLatestExplanation(undefined);

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: queryText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const startTime = Date.now();
    const result = await submitQuery(queryText, sessionId);
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, 1500 - elapsed);

    setTimeout(() => {
      setPhase("delivering");
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: result?.explanation || "",
          queryData: result || undefined,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLatestExplanation(result?.explanation);
        setPhase("ready");
        fetchHistory();
      }, 800);
    }, remainingDelay);
  }, [sessionId, submitQuery, fetchHistory]);

  // Feature 8: Pin / unpin a chart message
  const handlePin = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === id ? { ...m, pinned: !m.pinned } : m)
    );
  }, []);

  // Feature 2: Sample chips — show only before first message
  const showSampleChips = messages.length === 0 && !queryLoading;

  if (isAuthenticated === false) {
    return (
      <div className="h-screen flex items-center justify-center p-8 text-center bg-background">
        <p className="text-muted">You must be logged in. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden antialiased transition-colors duration-300">
      {/* LEFT SIDEBAR */}
      <div className="hidden lg:block w-[280px] xl:w-[320px] flex-shrink-0 z-20 shadow-[4px_0_24px_-15px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_24px_-15px_rgba(0,0,0,0.5)] border-r border-black/5 dark:border-white/5 bg-surface/50 backdrop-blur-md">
        <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <h1 className="font-serif text-xl tracking-tight font-bold">QueryLens.</h1>
          <ThemeToggle />
        </div>
        <div className="h-[calc(100vh-65px)] overflow-y-auto w-full">
          <QueryHistory
            items={history}
            loading={historyLoading}
            onSelect={(q) => handleQuerySubmit(q)}
          />
        </div>
      </div>

      {/* CENTER: Chat Thread */}
      <div className="flex-1 flex flex-col relative z-0 min-w-0">
        <div className="flex-1 bg-surface/40 dark:bg-surface/20 backdrop-blur-sm border-t border-l border-white/50 dark:border-white/10 shadow-inner overflow-hidden">
          {error && phase !== "querying" && phase !== "delivering" ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-red-500 dark:text-red-400 max-w-lg text-center bg-red-50 dark:bg-red-500/10 p-6 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-sm">
                <h3 className="font-serif text-xl mb-2">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <ChatThread
              messages={messages}
              loading={queryLoading && phase === "querying"}
              onPin={handlePin}
            />
          )}
        </div>

        {/* Feature 2: Sample query chips — only when empty */}
        {showSampleChips && (
          <SampleQueryChips
            onSelect={handleQuerySubmit}
            disabled={phase === "querying" || phase === "delivering"}
          />
        )}

        {/* BOTTOM: Query Input + Voice */}
        <QueryInput
          onSubmit={handleQuerySubmit}
          disabled={phase === "querying" || phase === "delivering"}
        />
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0 z-20 shadow-[-4px_0_24px_-15px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_24px_-15px_rgba(0,0,0,0.5)] border-l border-black/5 dark:border-white/5 bg-surface/50 backdrop-blur-md">
        <ResponsePanel
          phase={phase}
          queryEcho={activeQuery}
          explanation={latestExplanation}
        />
      </div>
    </div>
  );
}
