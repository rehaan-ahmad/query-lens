"use client";
import React from "react";
import { History, BarChart2, PieChart, Activity, Grip, LayoutTemplate, Upload, List, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export type HistoryItemData = {
  id: number;
  session_id: string;
  user_query: string;
  chart_type: string;
  created_at: string;
};

interface QueryHistoryProps {
  items: HistoryItemData[];
  onSelect: (query: string) => void;
  loading: boolean;
}

const getChartIcon = (type: string) => {
  switch (type) {
    case "bar": return <BarChart2 className="w-4 h-4" />;
    case "pie": return <PieChart className="w-4 h-4" />;
    case "line": return <Activity className="w-4 h-4" />;
    case "scatter": return <Grip className="w-4 h-4" />;
    case "stat_card": return <LayoutTemplate className="w-4 h-4" />;
    default: return <History className="w-4 h-4" />;
  }
};

export default function QueryHistory({ items, onSelect, loading }: QueryHistoryProps) {
  const { logout } = useAuth();
  return (
    <div className="w-full h-full flex flex-col bg-surface border-r border-muted/20">
      <div className="p-6 border-b border-muted/20 bg-cream/30">
        <h2 className="font-serif text-lg text-ink flex items-center mb-1">
          <History className="w-5 h-5 mr-2 text-olive" />
          Session History
        </h2>
        <p className="text-xs text-muted">Recent insights for this session</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading && items.length === 0 ? (
          <div className="flex justify-center p-4">
            <span className="text-sm font-mono animate-pulse text-muted">Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center p-4 text-sm text-muted/80 italic mt-8">
            No query history yet. Ask a question to get started.
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelect(item.user_query)}
              className="group p-4 bg-cream/30 hover:bg-cream border border-transparent hover:border-olive/30 rounded-xl cursor-pointer transition-all duration-200"
            >
              <p className="text-sm text-ink mb-3 line-clamp-2 leading-relaxed transition-colors group-hover:text-navy">
                &quot;{item.user_query}&quot;
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center text-muted font-medium bg-surface px-2 py-1 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-muted/10">
                  <span className="mr-1.5 text-olive/80">{getChartIcon(item.chart_type)}</span>
                  <span className="capitalize">{item.chart_type.replace('_', ' ')}</span>
                </span>
                
                <span className="text-muted/60 font-mono text-[10px]">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-muted/20 bg-surface flex flex-col space-y-2">
        <Link href="/upload" className="flex items-center text-sm p-2 rounded hover:bg-cream text-muted hover:text-navy transition-colors font-medium">
          <Upload className="w-4 h-4 mr-3 text-olive/80" />
          Upload Data
        </Link>
        <Link href="/history" className="flex items-center text-sm p-2 rounded hover:bg-cream text-muted hover:text-navy transition-colors font-medium">
          <List className="w-4 h-4 mr-3 text-olive/80" />
          Full History
        </Link>
        <button onClick={logout} className="flex items-center text-sm p-2 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors w-full text-left font-medium">
          <LogOut className="w-4 h-4 mr-3 opacity-80" />
          Logout
        </button>
      </div>
    </div>
  );
}
