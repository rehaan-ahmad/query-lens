import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Basic check: is there a token in localStorage?
    const token = localStorage.getItem("querylens_token");
    if (token) {
      setIsAuthenticated(true);
      // In a real app we'd decode JWT or call /api/me. Hardcoding for demo.
      setUsername("admin");
    } else {
      setIsAuthenticated(false);
      setUsername(null);
    }
  }, []);

  const login = async (user: string, pass: string) => {
    try {
      const formData = new FormData();
      formData.append("username", user);
      formData.append("password", pass);

      const res = await api.post("/api/auth/token", formData);
      const token = res.data.access_token;
      
      localStorage.setItem("querylens_token", token);
      setIsAuthenticated(true);
      setUsername(user);
      return { success: true };
    } catch (err: unknown) {
      return { 
        success: false, 
        error: ((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail) || "Login failed" 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("querylens_token");
    setIsAuthenticated(false);
    setUsername(null);
    window.location.href = "/login";
  };

  return { isAuthenticated, username, login, logout };
}
