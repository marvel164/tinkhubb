"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const PUBLIC_THEME_KEY = "tinkhupp-theme";

function readPublicTheme() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PUBLIC_THEME_KEY) === "dark";
}

function applyPublicTheme(isDark: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  const [isDark, setIsDark] = useState(false);

  /*
   * Public theme is loaded only for the public Tinkhupp surface.
   *
   * Admin routes are deliberately excluded because AdminShell owns
   * the admin theme independently.
   */
  useEffect(() => {
    if (isAdminRoute) {
      /*
       * Never allow the public theme to control the admin surface.
       * AdminShell will immediately apply the admin preference.
       */
      document.documentElement.classList.remove("dark");
      return;
    }

    const saved = readPublicTheme();

    setIsDark(saved);
    applyPublicTheme(saved);
  }, [isAdminRoute]);

  function toggleTheme() {
    /*
     * This provider must never toggle the admin surface.
     */
    if (isAdminRoute) {
      return;
    }

    setIsDark((current) => {
      const next = !current;

      window.localStorage.setItem(PUBLIC_THEME_KEY, next ? "dark" : "light");

      applyPublicTheme(next);

      return next;
    });
  }

  const value = useMemo(
    () => ({
      isDark,
      toggleTheme,
    }),
    [isDark, isAdminRoute],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider.");
  }

  return context;
}
