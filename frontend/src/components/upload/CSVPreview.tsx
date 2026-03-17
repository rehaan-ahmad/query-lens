"use client";
import React, { useEffect, useState } from "react";
import Papa from "papaparse";

interface CSVPreviewProps {
  file: File;
}

export default function CSVPreview({ file }: CSVPreviewProps) {
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      preview: 5, // Only parse first 5 rows for performance
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setColumns(results.meta.fields);
        }
        setData(results.data as Record<string, string>[]);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setLoading(false);
      }
    });
  }, [file]);

  if (loading) {
    return <div className="p-8 text-center text-muted font-mono animate-pulse">Parsing CSV preview...</div>;
  }

  if (columns.length === 0) {
    return <div className="p-8 text-center text-red-500">Could not read columns from the selected file.</div>;
  }

  return (
    <div className="w-full bg-surface rounded-xl border border-muted/20 overflow-hidden shadow-sm">
      <div className="bg-surface/50 px-4 py-3 border-b border-muted/20 flex justify-between items-center">
        <h4 className="text-sm font-semibold text-navy">Data Preview</h4>
        <span className="text-xs font-mono text-muted bg-surface px-2 py-0.5 rounded border border-muted/10">
          Showing first {data.length} rows
        </span>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted uppercase bg-surface/20">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/10">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-surface/30 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-2.5 text-foreground whitespace-nowrap max-w-[200px] truncate">
                    {row[col] || <span className="text-muted/40 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
