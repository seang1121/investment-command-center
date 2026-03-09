"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ViewMode = "simple" | "advanced";

interface UserPreferences {
  mode: ViewMode;
}

interface PreferencesContextValue {
  preferences: UserPreferences;
  setMode: (mode: ViewMode) => void;
  isSimple: boolean;
}

const STORAGE_KEY = "fa-preferences";

const defaults: UserPreferences = { mode: "simple" };

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: defaults,
  setMode: () => {},
  isSimple: true,
});

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaults);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserPreferences>;
        setPreferences((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore corrupt localStorage
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Quota exceeded — ignore
    }
  }, [preferences]);

  const setMode = useCallback((mode: ViewMode) => {
    setPreferences((prev) => ({ ...prev, mode }));
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setMode,
        isSimple: preferences.mode === "simple",
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
