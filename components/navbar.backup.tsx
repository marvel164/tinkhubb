"use client";

import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Play Game", href: "/play" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "My Profile", href: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#f1ddd0] bg-[#fffaf6]/95 backdrop-blur transition-colors duration-200 dark:border-[#3a2923] dark:bg-[#17110e]/95">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="shrink-0 text-[22px] font-bold tracking-[-0.03em] text-[#FF6B00]"
          onClick={() => setMobileOpen(false)}
        >
          TinkHubb
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-2 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                  active
                    ? "text-[#451900] dark:text-[#fff4ec]"
                    : "text-[#765646] hover:text-[#FF6B00] dark:text-[#cdb8aa] dark:hover:text-[#FF6B00]"
                }`}
              >
                {link.label}

                {active && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-[#FF6B00]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead5c8] bg-white text-[#765646] transition hover:border-[#FF6B00] hover:text-[#FF6B00] dark:border-[#49352c] dark:bg-[#241914] dark:text-[#cdb8aa] dark:hover:border-[#FF6B00] dark:hover:text-[#FF6B00]"
          >
            {isDark ? (
              <Sun size={17} strokeWidth={1.8} />
            ) : (
              <Moon size={17} strokeWidth={1.8} />
            )}
          </button>

          <Link
            href="/play"
            className="rounded-full bg-[#FF6B00] px-6 py-3 text-[13px] font-bold text-white transition hover:opacity-90"
          >
            Play Now
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead5c8] bg-white text-[#765646] transition hover:border-[#FF6B00] hover:text-[#FF6B00] dark:border-[#49352c] dark:bg-[#241914] dark:text-[#cdb8aa] dark:hover:border-[#FF6B00] dark:hover:text-[#FF6B00]"
          >
            {isDark ? (
              <Sun size={17} strokeWidth={1.8} />
            ) : (
              <Moon size={17} strokeWidth={1.8} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead5c8] bg-white text-[#451900] dark:border-[#49352c] dark:bg-[#241914] dark:text-[#fff4ec]"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#f1ddd0] bg-[#fffaf6] px-5 py-5 dark:border-[#3a2923] dark:bg-[#17110e] lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.06em] transition ${
                    active
                      ? "bg-[#fff0e5] text-[#FF6B00] dark:bg-[#2b1b14] dark:text-[#FF6B00]"
                      : "text-[#765646] hover:bg-[#fff4ec] hover:text-[#FF6B00] dark:text-[#cdb8aa] dark:hover:bg-[#241914] dark:hover:text-[#FF6B00]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/play"
            onClick={() => setMobileOpen(false)}
            className="mt-4 block rounded-full bg-[#FF6B00] px-6 py-3 text-center text-sm font-bold text-white"
          >
            Play Now
          </Link>
        </div>
      )}
    </header>
  );
}
