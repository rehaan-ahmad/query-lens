"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import PageTransition from "@/components/animation/PageTransition";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await login(username, password);
    if (!res.success) {
      setError(res.error || "Invalid credentials.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 antialiased">
        
        <div className="w-full max-w-md bg-surface p-10 rounded-2xl shadow-xl border border-muted/20 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-olive to-navy"></div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-serif text-navy mb-2">QueryLens</h1>
            <p className="text-sm text-muted">Sign in to access the BI Dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-muted/30 focus:outline-none focus:ring-2 focus:ring-olive/50 focus:border-olive transition-colors text-ink"
                required 
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-muted/30 focus:outline-none focus:ring-2 focus:ring-olive/50 focus:border-olive transition-colors text-ink"
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-navy text-white rounded-xl py-3.5 mt-4 font-medium hover:bg-olive transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-muted font-mono">
              Demo access: admin / querylens2024
            </p>
          </div>
        </div>
        
      </div>
    </PageTransition>
  );
}
