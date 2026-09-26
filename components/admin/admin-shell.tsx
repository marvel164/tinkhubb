"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Flame,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AdminShellProps = {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  active:
    | "dashboard"
    | "questions"
    | "users"
    | "leaderboard"
    | "streaks"
    | "winners"
    | "settings";
};

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

const ADMIN_THEME_PREFIX = "tinkhupp-admin-theme:";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    key: "dashboard" as const,
    icon: LayoutDashboard,
  },
  {
    label: "Question Bank",
    href: "/admin/questions",
    key: "questions" as const,
    icon: HelpCircle,
  },
  {
    label: "Players",
    href: "/admin/users",
    key: "users" as const,
    icon: Users,
  },
  {
    label: "Leaderboard",
    href: "/admin/leaderboard",
    key: "leaderboard" as const,
    icon: Trophy,
  },
  {
    label: "Streaks",
    href: "/admin/streaks",
    key: "streaks" as const,
    icon: Flame,
  },
  {
    label: "Winner Selection",
    href: "/admin/winners",
    key: "winners" as const,
    icon: Trophy,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    key: "settings" as const,
    icon: Settings,
  },
];

function getAdminThemeKey(email: string) {
  return `${ADMIN_THEME_PREFIX}${email.trim().toLowerCase()}`;
}

function applyDarkMode(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function AdminShell({
  children,
  adminName,
  adminEmail,
  adminRole,
  active,
}: AdminShellProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const themeKey = useMemo(() => getAdminThemeKey(adminEmail), [adminEmail]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(themeKey) === "dark";

    setIsDark(savedTheme);
    applyDarkMode(savedTheme);
    setThemeReady(true);
  }, [themeKey]);

  useEffect(() => {
    if (!themeReady) return;

    const savedTheme = window.localStorage.getItem(themeKey) === "dark";

    setIsDark(savedTheme);
    applyDarkMode(savedTheme);
  }, [pathname, themeKey, themeReady]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        setNotificationsLoading(true);

        const response = await fetch("/api/admin/notifications", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();

        if (cancelled) return;

        setNotifications(result.data?.notifications ?? []);
        setUnreadCount(result.data?.unreadCount ?? 0);
      } catch (error) {
        console.error("Failed to load admin notifications:", error);
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (
        window.location.pathname === "/admin" ||
        window.location.pathname.startsWith("/admin/")
      ) {
        return;
      }

      applyDarkMode(false);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  function toggleAdminTheme() {
    setIsDark((current) => {
      const next = !current;
      const nextTheme = next ? "dark" : "light";

      window.localStorage.setItem(themeKey, nextTheme);
      window.localStorage.setItem("tinkhupp-admin-theme", nextTheme);

      document.cookie = `tinkhupp-admin-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;

      applyDarkMode(next);

      return next;
    });
  }

  async function markNotificationAsRead(id: string) {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) return;

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ all: true }),
      });

      if (!response.ok) return;

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/admin/login";
    }
  }

  const initials =
    adminName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD";

  const activeLabel =
    navigation.find((item) => item.key === active)?.label ?? "Admin";

  if (!themeReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8] text-[#171717] dark:bg-[#15120f] dark:text-[#fff4ec]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#ff6b00] border-t-transparent" />

          <p className="text-[11px] font-medium text-[#777b80] dark:text-[#aaa098]">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "min-h-screen",
        isDark ? "bg-[#15120f] text-[#fff4ec]" : "bg-[#f5f6f8] text-[#171717]",
      ].join(" ")}
    >
      {/* Desktop sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 hidden w-[210px] border-r lg:flex lg:flex-col",
          isDark
            ? "border-[#342a24] bg-[#1b1714]"
            : "border-[#e6e7e9] bg-white",
        ].join(" ")}
      >
        <div
          className={[
            "flex h-[64px] shrink-0 items-center border-b px-5",
            isDark ? "border-[#342a24]" : "border-[#eeeeef]",
          ].join(" ")}
        >
          <Link
            href="/admin"
            className="text-[19px] font-extrabold tracking-[-0.04em] text-[#ff6b00]"
          >
            Tinkhupp
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p
            className={[
              "mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.14em]",
              isDark ? "text-[#756960]" : "text-[#a1a3a7]",
            ].join(" ")}
          >
            Main Menu
          </p>

          <nav aria-label="Admin navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = active === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={[
                    "mb-1 flex min-h-[40px] items-center gap-3 rounded-[5px] px-3 text-[11px] font-semibold transition-colors",
                    selected
                      ? isDark
                        ? "bg-[#4a2818] text-white"
                        : "bg-[#fff0e5] text-[#ff6b00]"
                      : isDark
                        ? "text-[#bdb0a8] hover:bg-[#29201b]"
                        : "text-[#6f7278] hover:bg-[#f5f5f5]",
                  ].join(" ")}
                >
                  <Icon size={15} strokeWidth={1.9} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div
          className={[
            "shrink-0 border-t p-4",
            isDark ? "border-[#342a24]" : "border-[#eeeeef]",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                isDark
                  ? "bg-[#3a2418] text-[#ffb27a]"
                  : "bg-[#fff0e5] text-[#ff6b00]",
              ].join(" ")}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <p
                className={[
                  "truncate text-[10px] font-bold",
                  isDark ? "text-[#fff4ec]" : "text-[#272727]",
                ].join(" ")}
              >
                {adminName}
              </p>

              <p
                className={[
                  "truncate text-[9px]",
                  isDark ? "text-[#877970]" : "text-[#999b9f]",
                ].join(" ")}
              >
                {adminRole}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={[
              "mt-3 flex min-h-[34px] w-full items-center gap-2 rounded-[4px] px-3 text-[10px] font-semibold transition-colors",
              isDark
                ? "text-[#a89b94] hover:bg-[#29201b] hover:text-white"
                : "text-[#777b80] hover:bg-[#f5f5f5] hover:text-[#222]",
            ].join(" ")}
          >
            <LogOut size={14} strokeWidth={1.9} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile / medium sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />

          <aside
            className={[
              "relative flex h-full w-[min(82vw,280px)] flex-col border-r shadow-[8px_0_30px_rgba(0,0,0,0.12)]",
              isDark
                ? "border-[#342a24] bg-[#1b1714]"
                : "border-[#e6e7e9] bg-white",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-[64px] shrink-0 items-center justify-between border-b px-5",
                isDark ? "border-[#342a24]" : "border-[#eeeeef]",
              ].join(" ")}
            >
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="text-[19px] font-extrabold tracking-[-0.04em] text-[#ff6b00]"
              >
                Tinkhupp
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  isDark
                    ? "text-[#d7cbc4] hover:bg-[#29201b]"
                    : "text-[#6f7278] hover:bg-[#f5f5f5]",
                ].join(" ")}
                aria-label="Close navigation"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-6">
              <p
                className={[
                  "mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.14em]",
                  isDark ? "text-[#756960]" : "text-[#a1a3a7]",
                ].join(" ")}
              >
                Main Menu
              </p>

              <nav aria-label="Mobile admin navigation">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const selected = active === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "mb-1 flex min-h-[44px] items-center gap-3 rounded-[5px] px-3 text-[11px] font-semibold",
                        selected
                          ? isDark
                            ? "bg-[#4a2818] text-white"
                            : "bg-[#fff0e5] text-[#ff6b00]"
                          : isDark
                            ? "text-[#bdb0a8] hover:bg-[#29201b]"
                            : "text-[#6f7278] hover:bg-[#f5f5f5]",
                      ].join(" ")}
                    >
                      <Icon size={16} strokeWidth={1.9} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div
              className={[
                "border-t p-4",
                isDark ? "border-[#342a24]" : "border-[#eeeeef]",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    isDark
                      ? "bg-[#3a2418] text-[#ffb27a]"
                      : "bg-[#fff0e5] text-[#ff6b00]",
                  ].join(" ")}
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <p
                    className={[
                      "truncate text-[10px] font-bold",
                      isDark ? "text-[#fff4ec]" : "text-[#272727]",
                    ].join(" ")}
                  >
                    {adminName}
                  </p>

                  <p
                    className={[
                      "truncate text-[9px]",
                      isDark ? "text-[#877970]" : "text-[#999b9f]",
                    ].join(" ")}
                  >
                    {adminRole}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className={[
                  "flex min-h-[38px] w-full items-center gap-2 rounded-[4px] px-3 text-[10px] font-semibold",
                  isDark
                    ? "text-[#a89b94] hover:bg-[#29201b] hover:text-white"
                    : "text-[#777b80] hover:bg-[#f5f5f5] hover:text-[#222]",
                ].join(" ")}
              >
                <LogOut size={14} strokeWidth={1.9} />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main application */}
      <div className="lg:pl-[210px]">
        <header
          className={[
            "sticky top-0 z-30 flex h-[64px] items-center justify-between border-b px-4 sm:px-5 lg:px-7",
            isDark
              ? "border-[#342a24] bg-[#1b1714]/95"
              : "border-[#e6e7e9] bg-white/95",
            "backdrop-blur-md",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden",
                isDark
                  ? "text-[#d7cbc4] hover:bg-[#29201b]"
                  : "text-[#6f7278] hover:bg-[#f5f5f5]",
              ].join(" ")}
              aria-label="Open admin navigation"
            >
              <Menu size={19} strokeWidth={1.9} />
            </button>

            <p
              className={[
                "truncate text-[12px] font-semibold sm:text-[13px]",
                isDark ? "text-[#fff4ec]" : "text-[#333]",
              ].join(" ")}
            >
              {activeLabel}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Header search is intentionally hidden below large screens
                so medium layouts do not become cramped. */}
            <div className="hidden lg:block">
              <div
                className={[
                  "flex h-9 w-[190px] items-center rounded-[5px] border px-3 text-[10px]",
                  isDark
                    ? "border-[#3a302a] bg-[#211c18] text-[#82776f]"
                    : "border-[#e7e7e8] bg-[#fafafa] text-[#9b9da1]",
                ].join(" ")}
              >
                Search...
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAdminTheme}
              aria-label={
                isDark
                  ? "Switch admin to light mode"
                  : "Switch admin to dark mode"
              }
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                isDark
                  ? "text-[#d7cbc4] hover:bg-[#29201b]"
                  : "text-[#6f7278] hover:bg-[#f5f5f5]",
              ].join(" ")}
            >
              {isDark ? (
                <Sun size={17} strokeWidth={2} />
              ) : (
                <Moon size={17} strokeWidth={2} />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                aria-label={
                  unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "Notifications"
                }
                aria-expanded={notificationsOpen}
                className={[
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  isDark
                    ? "text-[#d7cbc4] hover:bg-[#29201b]"
                    : "text-[#6f7278] hover:bg-[#f5f5f5]",
                ].join(" ")}
              >
                <Bell size={17} strokeWidth={2} />

                {unreadCount > 0 && (
                  <span className="absolute right-[6px] top-[5px] flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#ff6b00] px-1 text-[7px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className={[
                    "fixed left-3 right-3 top-[72px] z-50 overflow-hidden rounded-[8px] border shadow-[0_12px_35px_rgba(0,0,0,0.12)] sm:absolute sm:left-auto sm:right-0 sm:top-[48px] sm:w-[340px]",
                    isDark
                      ? "border-[#3a302a] bg-[#211c18]"
                      : "border-[#e6e7e9] bg-white",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex items-center justify-between border-b px-4 py-3",
                      isDark ? "border-[#3a302a]" : "border-[#eeeeef]",
                    ].join(" ")}
                  >
                    <div>
                      <p
                        className={[
                          "text-[11px] font-bold",
                          isDark ? "text-[#fff4ec]" : "text-[#272727]",
                        ].join(" ")}
                      >
                        Notifications
                      </p>

                      {unreadCount > 0 && (
                        <p
                          className={[
                            "mt-0.5 text-[9px]",
                            isDark ? "text-[#a89b94]" : "text-[#999b9f]",
                          ].join(" ")}
                        >
                          {unreadCount} unread
                        </p>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="text-[9px] font-semibold text-[#ff6b00] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[min(390px,calc(100vh-150px))] overflow-y-auto">
                    {notificationsLoading ? (
                      <div
                        className={[
                          "flex items-center justify-center px-4 py-10 text-[10px]",
                          isDark ? "text-[#8f827a]" : "text-[#999b9f]",
                        ].join(" ")}
                      >
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div
                        className={[
                          "flex flex-col items-center justify-center px-5 py-10 text-center",
                          isDark ? "text-[#8f827a]" : "text-[#999b9f]",
                        ].join(" ")}
                      >
                        <Bell size={20} className="mb-2 opacity-50" />

                        <p className="text-[10px] font-semibold">
                          No notifications yet
                        </p>

                        <p className="mt-1 text-[9px]">
                          New admin activity will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            if (!notification.isRead) {
                              markNotificationAsRead(notification.id);
                            }
                          }}
                          className={[
                            "flex w-full gap-3 border-b px-4 py-3 text-left transition-colors",
                            isDark
                              ? "border-[#302721] hover:bg-[#29201b]"
                              : "border-[#f0f0f0] hover:bg-[#fafafa]",
                            !notification.isRead
                              ? isDark
                                ? "bg-[#261b15]"
                                : "bg-[#fffaf6]"
                              : "",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "mt-1 h-2 w-2 shrink-0 rounded-full",
                              notification.isRead
                                ? "bg-transparent"
                                : "bg-[#ff6b00]",
                            ].join(" ")}
                          />

                          <span className="min-w-0 flex-1">
                            <span
                              className={[
                                "block text-[10px] font-bold",
                                isDark ? "text-[#fff4ec]" : "text-[#272727]",
                              ].join(" ")}
                            >
                              {notification.title}
                            </span>

                            <span
                              className={[
                                "mt-1 block text-[9px] leading-[1.45]",
                                isDark ? "text-[#a89b94]" : "text-[#777b80]",
                              ].join(" ")}
                            >
                              {notification.message}
                            </span>

                            <span
                              className={[
                                "mt-1.5 block text-[8px]",
                                isDark ? "text-[#756960]" : "text-[#a1a3a7]",
                              ].join(" ")}
                            >
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className={[
                "hidden h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold sm:flex",
                isDark
                  ? "bg-[#3a2418] text-[#ffb27a]"
                  : "bg-[#fff0e5] text-[#ff6b00]",
              ].join(" ")}
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </div>
    </div>
  );
}
