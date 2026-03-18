import { useState } from "react";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

export type QueryResponseData = {
  chart_type?: string;
  data?: Record<string, unknown>[];
  columns?: string[];
  explanation?: string;
  query_echo?: string;
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

      const res = await api.post("/api/query", payload);
      if (res.data?.type === "cannot_answer") {
        const result: QueryResponseData = {
          chart_type: "cannot_answer",
          explanation:
            res.data?.message ||
            "I could not find data to answer that question from the available inventory.",
        };
        return result;
      } else {
        return res.data as QueryResponseData;
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        if (err.response.data?.type === "cannot_answer") {
          return {
            chart_type: "cannot_answer",
            explanation:
              err.response.data?.message ||
              "I could not find data to answer that question from the available inventory.",
          };
        } else {
          setError(
            err.response.data?.detail || "Error connecting to the server."
          );
        }
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
