"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminThemeContextValue = {
  isDark: boolean;
  toggleAdminTheme: () => void;
  adminName: string;
  adminEmail: string;
  adminRole: string;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

const ADMIN_THEME_PREFIX = "tinkhupp-admin-theme:";

function getThemeKey(adminEmail: string) {
  return `${ADMIN_THEME_PREFIX}${adminEmail.trim().toLowerCase()}`;
}

function applyAdminTheme(isDark: boolean) {
  const root = document.documentElement;

  root.classList.toggle("dark", isDark);
  root.setAttribute("data-admin-theme", isDark ? "dark" : "light");
}

export function AdminThemeProvider({
  children,
  adminName,
  adminEmail,
  adminRole,
}: {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string;
  adminRole: string;
}) {
  const themeKey = useMemo(() => getThemeKey(adminEmail), [adminEmail]);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(themeKey);

    const nextIsDark = savedTheme === "dark";

    setIsDark(nextIsDark);
    applyAdminTheme(nextIsDark);

    /*
     * The provider stays mounted while navigating between
     * admin pages, so we intentionally do NOT reset the theme
     * during internal admin navigation.
     */
  }, [themeKey]);

  function toggleAdminTheme() {
    setIsDark((current) => {
      const next = !current;

      window.localStorage.setItem(themeKey, next ? "dark" : "light");

      applyAdminTheme(next);

      return next;
    });
  }

  const value = useMemo(
    () => ({
      isDark,
      toggleAdminTheme,
      adminName,
      adminEmail,
      adminRole,
    }),
    [isDark, adminName, adminEmail, adminRole],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error("useAdminTheme must be used inside AdminThemeProvider");
  }

  return context;
}
