"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useQuery";
import { useHistory } from "@/hooks/useHistory";
import { v4 as uuidv4 } from "uuid";
import QueryHistory from "@/components/query/QueryHistory";
import QueryInput from "@/components/query/QueryInput";
import ResponsePanel from "@/components/query/ResponsePanel";
import ChartRouter from "@/components/charts/ChartRouter";
import LoadingCube from "@/components/query/LoadingCube";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const { submitQuery, result, error } = useQuery();
  const { history, fetchHistory, loading: historyLoading } = useHistory(sessionId);
  const [phase, setPhase] = useState<"idle" | "querying" | "delivering" | "ready">("idle");
  const [activeQuery, setActiveQuery] = useState("");

  useEffect(() => {
    // Generate session ID if not exists
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

  const handleQuerySubmit = async (queryText: string) => {
    setActiveQuery(queryText);
    setPhase("querying");
    
    // Slight artificial delay to allow animation act 1 to play out (2000ms)
    // In production we would just await the real promise, but adding min duration for UX
    const startTime = Date.now();
    await submitQuery(queryText, sessionId);
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(0, 2000 - elapsed);
    
    setTimeout(() => {
      // Act 2: Delivering (squares spread out, color shift)
      setPhase("delivering");
      
      // Act 3: Ready (fade in chart and explanation)
      setTimeout(() => {
        setPhase("ready");
        fetchHistory(); // Refresh sidebar
      }, 1000);
    }, remainingDelay);
  };

  if (isAuthenticated === false) {
    return (
     <div className="h-screen flex items-center justify-center p-8 text-center bg-background">
       <p className="text-muted">You must be logged in. Redirecting...</p>
     </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden antialiased transition-colors duration-300">
      {/* LEFT SIDEBAR: History */}
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

      {/* CENTER: Chart Display */}
      <div className="flex-1 flex flex-col relative z-0">
        <div className="flex-1 p-8 rounded-tl-3xl bg-surface/40 dark:bg-surface/20 backdrop-blur-sm border-t border-l border-white/50 dark:border-white/10 shadow-inner overflow-hidden flex flex-col items-center justify-center">
          {error && phase !== "querying" && phase !== "delivering" ? (
             <div className="text-red-500 dark:text-red-400 max-w-lg text-center bg-red-50 dark:bg-red-500/10 p-6 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-sm">
               <h3 className="font-serif text-xl mb-2">Error</h3>
               <p>{error}</p>
             </div>
          ) : phase === "idle" ? (
            <div className="flex flex-col items-center text-center opacity-40">
              <div className="w-24 h-24 mb-6 text-foreground/20">
                 {/* Empty State Icon */}
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                   <line x1="3" y1="9" x2="21" y2="9"></line>
                   <line x1="9" y1="21" x2="9" y2="9"></line>
                 </svg>
              </div>
              <h2 className="font-sans font-light text-2xl">No Insight Active</h2>
              <p className="mt-2 text-sm max-w-xs">Ask a question below to magically generate a visualization from the BMW catalogue.</p>
            </div>
          ) : (phase === "ready" && result) ? (
            <div className="w-full h-full animate-in fade-in zoom-in-95 duration-700 ease-out flex flex-col pt-4">
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-2xl font-serif tracking-tight">
                  Visualization: <span className="capitalize text-accent">{result.chart_type?.replace('_', ' ')}</span>
                </h2>
                <div className="text-xs font-mono bg-background px-3 py-1 rounded text-muted uppercase tracking-wider border border-black/10 dark:border-white/10">
                  {result.data?.length || 0} Records
                </div>
              </div>
              <div className="flex-1 bg-surface rounded-2xl p-6 shadow-sm border border-black/5 dark:border-white/10 flex flex-col min-h-0 relative">
                 <ChartRouter 
                   chartType={result.chart_type} 
                   data={result.data} 
                   columns={result.columns}
                   explanation={result.explanation} 
                 />
              </div>
            </div>
          ) : (
             <div className="w-full h-full flex items-center justify-center">
               <LoadingCube />
             </div>
          )}
        </div>

        {/* BOTTOM: Query Input */}
        <QueryInput onSubmit={handleQuerySubmit} disabled={phase === "querying" || phase === "delivering"} />
      </div>

      {/* RIGHT SIDEBAR: AI Response & Animations */}
      <div className="hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0 z-20 shadow-[-4px_0_24px_-15px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_24px_-15px_rgba(0,0,0,0.5)] border-l border-black/5 dark:border-white/5 bg-surface/50 backdrop-blur-md">
        <ResponsePanel 
          phase={phase} 
          queryEcho={activeQuery}
          explanation={result?.explanation}
        />
      </div>
    </div>
  );
}
