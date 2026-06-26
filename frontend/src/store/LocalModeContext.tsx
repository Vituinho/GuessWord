"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type LocalModeContextType = {
  isLocalMode: boolean;
  toggleLocalMode: () => void;
};

const LocalModeContext = createContext<LocalModeContextType | undefined>(undefined);

export function LocalModeProvider({ children }: { children: React.ReactNode }) {
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);

  // Initialize from localStorage client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("guessword-is-local");
      if (saved === "true") {
        setTimeout(() => {
          setIsLocalMode(true);
        }, 0);
      }
    }
  }, []);

  const toggleLocalMode = () => {
    const nextVal = !isLocalMode;
    setIsLocalMode(nextVal);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("guessword-is-local", String(nextVal));
    }
  };

  return (
    <LocalModeContext.Provider value={{ isLocalMode, toggleLocalMode }}>
      {children}
    </LocalModeContext.Provider>
  );
}

export function useLocalMode() {
  const context = useContext(LocalModeContext);
  if (context === undefined) {
    throw new Error("useLocalMode must be used within a LocalModeProvider");
  }
  return context;
}
