import { useState } from "react";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

export type QueryResponseData = {
  chart_type?: string;
  data?: Record<string, unknown>[];
  columns?: string[];
  explanation?: string;
  query_echo?: string;
  generated_sql?: string;
  confidence_level?: "high" | "medium" | "interpreted";
  chart_title?: string;
  key_insights?: string[];
  // cannot_answer specific
  suggestion?: string;
};

export function useQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuery = async (
    query: string,
    sessionId?: string
  ): Promise<QueryResponseData | null> => {
    setLoading(true);
    setError(null);

    try {
      const payload: { query: string; session_id?: string } = { query };
      if (sessionId) payload.session_id = sessionId;

      const res = await api.post("/api/query/", payload);

      // CannotAnswerResponse: HTTP 200 with type === "cannot_answer"
      if (res.data?.type === "cannot_answer") {
        return {
          chart_type:  "cannot_answer",
          explanation: res.data?.message  ?? "I could not find data to answer that question from the available inventory.",
          suggestion:  res.data?.suggestion ?? "",
        };
      }

      return res.data as QueryResponseData;

    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        const data = err.response.data;
        if (data?.type === "cannot_answer") {
          return {
            chart_type:  "cannot_answer",
            explanation: data?.message    ?? "I could not find data to answer that question from the available inventory.",
            suggestion:  data?.suggestion ?? "",
          };
        }
        setError(data?.detail || "Error connecting to the server.");
      } else {
        setError("An unexpected error occurred.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitQuery, loading, error };
}
