"use client";

import { useTheme } from "@/components/theme-provider";

export default function ThemeTestPage() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf6] p-6 text-[#451900] transition-colors dark:bg-[#17110e] dark:text-[#fff4ec]">
      <div className="w-full max-w-lg rounded-2xl border border-[#eadfd7] bg-white p-8 text-center shadow-sm dark:border-[#49352c] dark:bg-[#241b17]">
        <p className="text-sm font-semibold text-[#ff8a3d]">
          TinkHubb Theme Test
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Global Theme Test
        </h1>

        <p className="mt-3 text-sm text-[#6f7278] dark:text-[#c9bcb5]">
          Current theme:
          <span className="ml-1 font-bold text-[#451900] dark:text-[#fff4ec]">
            {theme}
          </span>
        </p>

        <div className="mt-6 rounded-xl bg-[#fff3eb] p-5 dark:bg-[#30231d]">
          <p className="text-sm">
            If the entire card, background, text and this box change when you
            click the button, the global theme system is working.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="mt-6 rounded-lg bg-[#ff8a3d] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
      </div>
    </main>
  );
}
