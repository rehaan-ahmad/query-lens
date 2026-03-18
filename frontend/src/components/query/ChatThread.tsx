"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import ChartRouter from "@/components/charts/ChartRouter";
import { QueryResponseData } from "@/hooks/useQuery";
import { Download, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Info, Pin, PinOff } from "lucide-react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  queryData?: QueryResponseData;
  timestamp: Date;
  pinned?: boolean;
};

interface ChatThreadProps {
  messages: ChatMessage[];
  loading: boolean;
  onPin?: (id: string) => void;
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ level }: { level?: string }) {
  if (!level) return null;
  const config = {
    high:         { label: "High Confidence",  icon: CheckCircle2, cls: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20" },
    medium:       { label: "Medium Confidence", icon: Info,          cls: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20" },
    interpreted:  { label: "Interpreted Query", icon: AlertTriangle, cls: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
  }[level] ?? { label: "High Confidence", icon: CheckCircle2, cls: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20" };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.cls}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── Chart Card ──────────────────────────────────────────────────────────────
function ChartCard({ msg, onPin }: { msg: ChatMessage; onPin?: (id: string) => void }) {
  const { queryData, id, pinned } = msg;
  const [showSQL, setShowSQL] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = useCallback(() => {
    const node = chartRef.current?.querySelector("svg");
    if (!node) return;
    try {
      const svgData = new XMLSerializer().serializeToString(node);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        canvas.width = img.width || 800;
        canvas.height = img.height || 400;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const a = document.createElement("a");
        a.download = `querylens-chart-${Date.now()}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      };
      img.src = url;
    } catch {
      // Fallback: open SVG in new tab
      const svgBlob = new Blob([new XMLSerializer().serializeToString(node)], { type: "image/svg+xml" });
      window.open(URL.createObjectURL(svgBlob));
    }
  }, []);

  if (!queryData?.chart_type || queryData.chart_type === "cannot_answer" || !queryData.data) return null;

  return (
    <div className={`bg-surface rounded-2xl shadow-sm border transition-all duration-200 ${pinned ? "border-accent/40 ring-1 ring-accent/20" : "border-black/5 dark:border-white/10"}`}>
      {/* Chart Header */}
      <div className="flex justify-between items-start px-5 pt-4 pb-2 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          {/* Feature 6: Chart Title */}
          <h3 className="text-sm font-semibold text-foreground truncate">
            {queryData.chart_title || queryData.chart_type?.replace("_", " ")}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Feature 1: Confidence Badge */}
            <ConfidenceBadge level={queryData.confidence_level} />
            <span className="text-[10px] font-mono text-muted capitalize">
              {queryData.chart_type?.replace("_", " ")} · {queryData.data?.length || 0} records
            </span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Feature 8: Pin */}
          {onPin && (
            <button
              onClick={() => onPin(id)}
              title={pinned ? "Unpin" : "Pin chart"}
              className={`p-1.5 rounded-lg transition-colors ${pinned ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-surface/80"}`}
            >
              {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          )}
          {/* Feature 3: Export PNG */}
          <button
            onClick={handleExportPNG}
            title="Export as PNG"
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface/80 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Feature 4: Show SQL Toggle */}
          <button
            onClick={() => setShowSQL((v) => !v)}
            title={showSQL ? "Hide SQL" : "Show SQL"}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-muted hover:text-foreground hover:bg-surface/80 transition-colors border border-black/5 dark:border-white/5"
          >
            SQL {showSQL ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Feature 4: SQL Disclosure */}
      {showSQL && queryData.generated_sql && (
        <div className="mx-5 mb-3 bg-background/80 rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Generated SQL</span>
          </div>
          <pre className="px-3 py-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {queryData.generated_sql}
          </pre>
        </div>
      )}

      {/* Chart */}
      <div ref={chartRef} className="px-5 pb-4 h-[320px]">
        <ChartRouter
          chartType={queryData.chart_type}
          data={queryData.data}
          columns={queryData.columns}
          explanation={queryData.explanation}
        />
      </div>

      {/* Feature 9: Key Insights */}
      {queryData.key_insights && queryData.key_insights.length > 0 && (
        <div className="border-t border-black/5 dark:border-white/5 px-5 pb-4 pt-3">
          <button
            onClick={() => setShowInsights((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-accent mb-2 hover:text-accent/80 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Key Insights
            {showInsights ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>
          {showInsights && (
            <ul className="space-y-1.5">
              {queryData.key_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-accent/60 mt-1.5 flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Thread ──────────────────────────────────────────────────────────────
export default function ChatThread({ messages, loading, onPin }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-5">
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.role === "user" ? (
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-accent text-white px-5 py-3 rounded-2xl rounded-br-md shadow-md">
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="max-w-[95%] w-full space-y-3">
                {/* Explanation */}
                {msg.content && (
                  <div className="bg-surface/50 dark:bg-surface/30 border border-black/5 dark:border-white/5 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm backdrop-blur-sm">
                    <div className="flex items-center mb-2">
                      <span className="w-2 h-2 rounded-full bg-accent mr-2" />
                      <span className="text-xs font-mono text-muted uppercase tracking-wider">QueryLens AI</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{msg.content}</p>
                  </div>
                )}

                {/* Chart Card (features 1, 3, 4, 6, 8, 9) */}
                <ChartCard msg={msg} onPin={onPin} />

                {/* Feature 5: Smart cannot_answer */}
                {msg.queryData?.chart_type === "cannot_answer" && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-5 py-4 rounded-2xl rounded-bl-md">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {msg.queryData.explanation || "I could not find data to answer that question."}
                    </p>
                    {msg.queryData.suggestion && (
                      <p className="text-xs text-muted mt-2 leading-relaxed italic">
                        💡 {msg.queryData.suggestion}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

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
