"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "tinkhubb-theme";

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyTheme = useCallback((nextTheme: Theme) => {
    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark",
    );

    document.documentElement.style.colorScheme = nextTheme;

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures.
    }

    setThemeState(nextTheme);
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);

      if (savedTheme === "dark") {
        applyTheme("dark");
        return;
      }
    } catch {
      // Fall back to light mode.
    }

    applyTheme("light");
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [applyTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme: applyTheme,
    }),
    [applyTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
