"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, getSession, clearSession } from "@/lib/api";

interface AuthContextType {
  session: Session | null;
  setSession: (s: Session | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSessionState(getSession());
    setIsLoading(false);
  }, []);

  const setSession = (s: Session | null) => setSessionState(s);

  const logout = () => {
    clearSession();
    setSessionState(null);
  };

  return (
    <AuthContext.Provider value={{ session, setSession, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
