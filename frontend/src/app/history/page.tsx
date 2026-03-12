"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHistory } from "@/hooks/useHistory";
import PageTransition from "@/components/animation/PageTransition";
import Link from "next/link";
import { ArrowLeft, History, PlayCircle } from "lucide-react";
import { format } from "date-fns";

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const { history, fetchHistory, loading } = useHistory(sessionId);

  useEffect(() => {
    const sid = sessionStorage.getItem("querylens_session");
    if (sid) setSessionId(sid);
  }, []);

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      fetchHistory();
    }
  }, [sessionId, isAuthenticated, fetchHistory]);

  if (isAuthenticated === false) {
    return <div className="p-8 text-center bg-cream min-h-screen">Redirecting...</div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream text-ink flex flex-col py-16 px-6 relative">
        <div className="w-full max-w-4xl mx-auto flex flex-col">
          
          <div className="flex items-center justify-between mb-16">
            <div>
              <Link href="/dashboard" className="text-muted hover:text-navy flex items-center text-sm font-medium transition-colors mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-4xl font-serif text-navy flex items-center">
                <History className="w-8 h-8 mr-4 text-olive" />
                Session History
              </h1>
              <p className="text-muted text-lg mt-2 font-light">
                Review your past queries and insights from this session.
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[39px] top-4 bottom-4 w-[2px] bg-muted/20 z-0"></div>

            <div className="space-y-8 z-10 relative">
              {loading && history.length === 0 ? (
                <div className="pl-24 py-8 text-muted animate-pulse font-mono flex items-center">
                  <div className="w-4 h-4 border-2 border-olive border-t-transparent rounded-full animate-spin mr-3"></div>
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="pl-24 py-8 text-muted/60 italic">
                  No query history found for this session.
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="relative flex items-start group">
                    
                    {/* Timeline Node */}
                    <div className="w-[80px] flex-shrink-0 flex justify-center pt-1.5 relative z-10">
                      <div className="w-4 h-4 rounded-full bg-cream border-[3px] border-olive shadow-sm group-hover:scale-125 transition-transform"></div>
                    </div>

                    <div className="flex-1 bg-surface rounded-2xl p-8 border border-muted/20 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-mono text-muted uppercase tracking-wider bg-cream/50 px-3 py-1 rounded">
                          {format(new Date(item.created_at), "h:mm a · MMM d, yyyy")}
                        </span>
                        
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider
                          ${item.chart_type === 'cannot_answer' ? 'bg-red-50 text-red-600' : 'bg-olive/10 text-olive'}`}>
                          {item.chart_type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-serif text-navy leading-snug mb-8">
                        &quot;{item.user_query}&quot;
                      </h3>

                      <div className="border-t border-muted/10 pt-6 flex justify-end">
                        <Link 
                          href={`/dashboard?replay=${encodeURIComponent(item.user_query)}`}
                          className="flex items-center text-sm font-medium text-navy hover:text-olive transition-colors"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Replay in Dashboard
                        </Link>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
