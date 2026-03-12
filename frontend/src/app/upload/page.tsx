"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DropZone from "@/components/upload/DropZone";
import CSVPreview from "@/components/upload/CSVPreview";
import PageTransition from "@/components/animation/PageTransition";
import { ArrowLeft, Upload, Loader2, Database } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function UploadPage() {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ rows: number, cols: number } | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const sessionId = sessionStorage.getItem("querylens_session") || "default";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_id", sessionId);

      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setStats({ 
        rows: res.data.row_count, 
        cols: res.data.columns.length 
      });
      setSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(errorObj.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (isAuthenticated === false) {
    return <div className="p-8 text-center text-ink bg-cream min-h-screen">Redirecting...</div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream text-ink flex flex-col items-center py-16 px-6 relative">
        <div className="w-full max-w-4xl absolute top-8 left-8 flex items-center">
          <Link href="/dashboard" className="text-muted hover:text-navy flex items-center text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="max-w-3xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif text-navy mb-3">Upload Custom Data</h1>
            <p className="text-muted text-lg font-light">
              Add your own CSV files to generate visualisations on custom datasets.
            </p>
          </div>

          <div className="flex flex-col space-y-8">
            {!success && (
              <div className="bg-surface p-2 rounded-3xl shadow-sm border border-muted/20 relative overflow-hidden">
                <DropZone onFileSelect={setFile} />
              </div>
            )}

            {file && !success && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <CSVPreview file={file} />
                
                {error && (
                  <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-[12px] border border-red-100 text-sm font-medium text-center">
                    {error}
                  </div>
                )}
                
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-navy text-white px-8 py-4 rounded-[12px] hover:bg-olive transition-colors font-medium flex items-center shadow-md disabled:opacity-50"
                  >
                    {uploading ? (
                      <><Loader2 className="w-5 h-5 mr-3 animate-spin"/> Loading into Database...</>
                    ) : (
                      <><Upload className="w-5 h-5 mr-3"/> Analyse Data</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-surface p-12 rounded-[24px] border border-muted/20 shadow-sm text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-olive/10 text-olive rounded-full flex items-center justify-center mx-auto mb-6">
                  <Database className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif text-navy mb-4">Upload Successful</h2>
                <p className="text-muted mb-8 max-w-md mx-auto text-balance">
                  Your dataset has been successfully loaded into the AthenaGuard-protected execution layer.
                </p>
                
                <div className="flex items-center justify-center space-x-6 mb-12">
                  <div className="bg-cream/50 px-6 py-4 rounded-xl border border-muted/10">
                    <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Rows Parsed</div>
                    <div className="text-3xl font-sans font-light text-navy">{stats?.rows.toLocaleString()}</div>
                  </div>
                  <div className="bg-cream/50 px-6 py-4 rounded-xl border border-muted/10">
                    <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Columns</div>
                    <div className="text-3xl font-sans font-light text-navy">{stats?.cols}</div>
                  </div>
                </div>

                <Link 
                  href="/dashboard"
                  className="bg-navy text-white px-8 py-4 rounded-[12px] hover:bg-olive transition-all font-medium inline-block shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Return to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
