import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { HistoryItemData } from "@/components/query/QueryHistory";

export function useHistory(sessionId: string) {
  const [history, setHistory] = useState<HistoryItemData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/query/history?session_id=${sessionId}`);
      setHistory(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return { history, loading, fetchHistory };
}
