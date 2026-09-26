"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  TrendingUp,
  Users,
  Trophy,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StreakStatus = "ON_TRACK" | "AT_RISK";

type Player = {
  id: string;
  username: string;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  lastPlayedKey: string | null;
  status: "ACTIVE" | "SUSPENDED";
  streakStatus: StreakStatus;
};

type Stats = {
  longestStreak: number;
  usersWith30DayStreak: number;
  activeStreaks: number;
  streaksAtRiskToday: number;
  streaksCompletedToday: number;
  streakCompletionRate: number;
};

type Distribution = {
  "1-2": number;
  "3-6": number;
  "7-13": number;
  "14-29": number;
  "30": number;
  "31+": number;
};

type Milestone = {
  milestone: number;
  reached: number;
  totalActiveStreaks: number;
  percentage: number;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    today: string;
    users: Player[];
    stats: Stats;
    distribution: Distribution;
    milestones: Milestone[];
  };
};

type FilterTab = "ALL" | "ON_TRACK" | "AT_RISK";

type SortOption =
  | "STREAK_DESC"
  | "STREAK_ASC"
  | "LONGEST_DESC"
  | "USERNAME_ASC"
  | "USERNAME_DESC"
  | "LAST_PLAYED_DESC";

const PAGE_SIZE = 10;

const distributionLabels: Array<keyof Distribution> = [
  "1-2",
  "3-6",
  "7-13",
  "14-29",
  "30",
  "31+",
];

function formatLastPlayed(date: string | null) {
  if (!date) return "Never";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(parsed);
}

function getNextMilestone(streak: number) {
  const milestones = [7, 14, 30, 60, 90];

  for (const milestone of milestones) {
    if (streak < milestone) {
      return milestone;
    }
  }

  return null;
}

function StatusBadge({ status }: { status: StreakStatus }) {
  const isAtRisk = status === "AT_RISK";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold ${
        isAtRisk
          ? "bg-[#fff1f1] text-[#ef3e4a] dark:bg-[#3a211f] dark:text-[#ff8e96]"
          : "bg-[#edf9f2] text-[#168653] dark:bg-[#183024] dark:text-[#70d7a0]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isAtRisk ? "bg-[#ef3e4a]" : "bg-[#20a873]"
        }`}
      />

      {isAtRisk ? "At Risk" : "On Track"}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-[#e5e7ea] bg-white px-4 py-4 dark:border-[#342a24] dark:bg-[#1b1714]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-[#777b80] dark:text-[#a99d96]">
            {label}
          </p>

          <p className="mt-2 text-[23px] font-bold tracking-[-0.04em] text-[#171717] dark:text-[#fff4ec]">
            {value}
          </p>

          <p className="mt-1 truncate text-[9px] text-[#999ca1] dark:text-[#83766e]">
            {detail}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#fff0e5] text-[#ff6b00] dark:bg-[#3a2418] dark:text-[#ffb27a]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StreaksClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Stats>({
    longestStreak: 0,
    usersWith30DayStreak: 0,
    activeStreaks: 0,
    streaksAtRiskToday: 0,
    streaksCompletedToday: 0,
    streakCompletionRate: 0,
  });

  const [distribution, setDistribution] = useState<Distribution>({
    "1-2": 0,
    "3-6": 0,
    "7-13": 0,
    "14-29": 0,
    "30": 0,
    "31+": 0,
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<FilterTab>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("STREAK_DESC");
  const [page, setPage] = useState(1);

  async function loadStreaks(showRefreshState = false) {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/admin/streaks", {
        cache: "no-store",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.message || "Unable to load streak information.");
      }

      setPlayers(data.data.users);
      setStats(data.data.stats);
      setDistribution(data.data.distribution);
      setMilestones(data.data.milestones);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load streak information.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStreaks();
  }, []);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = players.filter((player) => {
      const matchesSearch =
        !normalizedSearch ||
        player.username.toLowerCase().includes(normalizedSearch);

      const matchesTab =
        tab === "ALL" ||
        (tab === "ON_TRACK" && player.streakStatus === "ON_TRACK") ||
        (tab === "AT_RISK" && player.streakStatus === "AT_RISK");

      return matchesSearch && matchesTab;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "STREAK_ASC":
          return a.currentStreak - b.currentStreak;

        case "LONGEST_DESC":
          return (
            b.longestStreak - a.longestStreak ||
            a.username.localeCompare(b.username)
          );

        case "USERNAME_ASC":
          return a.username.localeCompare(b.username);

        case "USERNAME_DESC":
          return b.username.localeCompare(a.username);

        case "LAST_PLAYED_DESC":
          return (
            (b.lastPlayedDate ? new Date(b.lastPlayedDate).getTime() : 0) -
            (a.lastPlayedDate ? new Date(a.lastPlayedDate).getTime() : 0)
          );

        case "STREAK_DESC":
        default:
          return (
            b.currentStreak - a.currentStreak ||
            b.longestStreak - a.longestStreak ||
            a.username.localeCompare(b.username)
          );
      }
    });
  }, [players, search, sort, tab]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));

  const visiblePlayers = filteredPlayers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, tab, sort]);

  const maxDistribution = Math.max(1, ...Object.values(distribution));

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[#f5f6f8] px-4 py-6 md:px-7 md:py-7 dark:bg-[#15120f]">
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[25px] font-bold tracking-[-0.035em] text-[#171717] dark:text-[#fff4ec]">
              Daily Streak Management
            </h1>

            <p className="mt-1 text-[11px] text-[#777b80] dark:text-[#a99d96]">
              Monitor active streaks and completion trends.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadStreaks(true)}
            disabled={refreshing}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] border border-[#dfe2e5] bg-white px-4 text-[10px] font-semibold text-[#55585d] transition hover:border-[#ff6b00] hover:text-[#ff6b00] disabled:opacity-60 sm:w-auto dark:border-[#3a302a] dark:bg-[#1b1714] dark:text-[#bdb0a8]"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-[7px] border border-[#ffd1d1] bg-[#fff5f5] px-4 py-3 text-[10px] text-[#c52f39] dark:border-[#4b2929] dark:bg-[#291b19] dark:text-[#ff9a9f]">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Longest Active Streak"
            value={stats.longestStreak}
            detail="Days"
            icon={<Trophy size={16} />}
          />

          <MetricCard
            label="Users With 30-Day Streak"
            value={stats.usersWith30DayStreak}
            detail="Current streak"
            icon={<Flame size={16} />}
          />

          <MetricCard
            label="Total Active Streaks"
            value={stats.activeStreaks}
            detail="Players with an active streak"
            icon={<Users size={16} />}
          />

          <MetricCard
            label="Streaks At Risk Today"
            value={stats.streaksAtRiskToday}
            detail={`${stats.streakCompletionRate}% completed today`}
            icon={<TrendingUp size={16} />}
          />
        </section>

        {/* Analytics */}
        <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Distribution */}
          <div className="rounded-[8px] border border-[#e5e7ea] bg-white p-5 dark:border-[#342a24] dark:bg-[#1b1714]">
            <h2 className="text-[13px] font-bold text-[#222] dark:text-[#fff4ec]">
              Streak Distribution
            </h2>

            <p className="mt-1 text-[9px] text-[#999ca1] dark:text-[#83766e]">
              Current active streak ranges.
            </p>

            <div className="mt-7 flex h-[205px] items-end gap-3 border-b border-[#eeeeef] px-2 dark:border-[#342a24]">
              {distributionLabels.map((label) => {
                const value = distribution[label];

                const height =
                  value === 0
                    ? 3
                    : Math.max(8, Math.round((value / maxDistribution) * 100));

                return (
                  <div
                    key={label}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <span className="mb-2 text-[9px] font-semibold text-[#777b80] dark:text-[#a99d96]">
                      {value}
                    </span>

                    <div
                      className="w-full max-w-[48px] rounded-t-[5px] bg-[#ff6b00]"
                      style={{ height: `${height}%` }}
                    />

                    <span className="mt-3 translate-y-5 whitespace-nowrap text-[8px] text-[#8f9297] dark:text-[#8f837b]">
                      {label} days
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestones */}
          <div className="rounded-[8px] border border-[#e5e7ea] bg-white p-5 dark:border-[#342a24] dark:bg-[#1b1714]">
            <h2 className="text-[13px] font-bold text-[#222] dark:text-[#fff4ec]">
              Milestone Progress
            </h2>

            <p className="mt-1 text-[9px] text-[#999ca1] dark:text-[#83766e]">
              Players currently reaching each milestone.
            </p>

            <div className="mt-6 space-y-5">
              {milestones.map((item) => (
                <div key={item.milestone}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#4b4d51] dark:text-[#d7cbc4]">
                      {item.milestone}-Day Milestone
                    </span>

                    <span className="text-[9px] font-semibold text-[#ff6b00]">
                      {item.reached}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0f1f2] dark:bg-[#29221d]">
                    <div
                      className="h-full rounded-full bg-[#ff6b00] transition-all"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-right text-[8px] text-[#999ca1] dark:text-[#83766e]">
                    {Math.round(item.percentage)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Player streaks */}
        <section className="mt-4 overflow-hidden rounded-[8px] border border-[#e5e7ea] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
          {/* Toolbar */}
          <div className="border-b border-[#eeeeef] p-5 dark:border-[#342a24]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-[#222] dark:text-[#fff4ec]">
                  Player Streaks
                </h2>

                <p className="mt-1 text-[9px] text-[#999ca1] dark:text-[#83766e]">
                  Monitor player streak activity and milestones.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
                <label className="relative block w-full sm:w-[190px]">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#999ca1] dark:text-[#83766e]"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search username..."
                    className="h-9 w-full rounded-[6px] border border-[#dfe2e5] bg-white pl-9 pr-3 text-[10px] text-[#333] outline-none transition placeholder:text-[#999ca1] focus:border-[#ff6b00] dark:border-[#3a302a] dark:bg-[#211c18] dark:text-[#fff4ec]"
                  />
                </label>

                <div className="relative w-full sm:w-[175px]">
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as SortOption)
                    }
                    className="h-9 w-full appearance-none rounded-[6px] border border-[#dfe2e5] bg-white px-3 pr-8 text-[10px] text-[#55585d] outline-none focus:border-[#ff6b00] dark:border-[#3a302a] dark:bg-[#211c18] dark:text-[#d7cbc4]"
                  >
                    <option value="STREAK_DESC">Current Streak</option>
                    <option value="STREAK_ASC">Streak: Low to High</option>
                    <option value="LONGEST_DESC">Longest Streak</option>
                    <option value="USERNAME_ASC">Username A-Z</option>
                    <option value="USERNAME_DESC">Username Z-A</option>
                    <option value="LAST_PLAYED_DESC">Last Played</option>
                  </select>

                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#888b90]"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex gap-5 border-b border-[#eeeeef] dark:border-[#342a24]">
              {[
                ["ALL", "All"],
                ["ON_TRACK", "On Track"],
                ["AT_RISK", "At Risk"],
              ].map(([value, label]) => {
                const active = tab === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value as FilterTab)}
                    className={`relative pb-3 text-[10px] font-semibold transition ${
                      active
                        ? "text-[#ff6b00]"
                        : "text-[#8b8e93] hover:text-[#55585d] dark:text-[#83766e] dark:hover:text-[#d7cbc4]"
                    }`}
                  >
                    {label}

                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff6b00]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[54px] animate-pulse rounded-[6px] bg-[#f1f2f3] dark:bg-[#29221d]"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead>
                    <tr className="bg-[#f7f7f8] dark:bg-[#28231f]">
                      {[
                        "Username",
                        "Current Streak",
                        "Longest Streak",
                        "Last Played",
                        "Next Milestone",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-[#7d8186] dark:text-[#83766e]"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {visiblePlayers.map((player) => {
                      const nextMilestone = getNextMilestone(
                        player.currentStreak,
                      );

                      return (
                        <tr
                          key={player.id}
                          className="border-b border-[#eeeeef] transition hover:bg-[#fafafa] last:border-0 dark:border-[#2d2520] dark:hover:bg-[#211c18]"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0e5] text-[9px] font-bold text-[#ff6b00] dark:bg-[#3a2418] dark:text-[#ffb27a]">
                                {player.username.slice(0, 2).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-bold text-[#333] dark:text-[#fff4ec]">
                                  {player.username}
                                </p>

                                <p className="mt-0.5 text-[8px] text-[#999ca1] dark:text-[#83766e]">
                                  {player.status === "SUSPENDED"
                                    ? "Suspended player"
                                    : "Active player"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Flame
                                size={13}
                                className="text-[#ff6b00]"
                                fill="currentColor"
                              />

                              <span className="text-[11px] font-bold text-[#333] dark:text-[#fff4ec]">
                                {player.currentStreak}
                              </span>

                              <span className="text-[8px] text-[#999ca1] dark:text-[#83766e]">
                                days
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-[10px] font-semibold text-[#55585d] dark:text-[#d7cbc4]">
                            {player.longestStreak} days
                          </td>

                          <td className="px-5 py-3.5 text-[9px] text-[#777b80] dark:text-[#a99d96]">
                            {formatLastPlayed(player.lastPlayedDate)}
                          </td>

                          <td className="px-5 py-3.5">
                            {nextMilestone ? (
                              <div>
                                <p className="text-[9px] font-semibold text-[#55585d] dark:text-[#d7cbc4]">
                                  {nextMilestone} days
                                </p>

                                <p className="mt-0.5 text-[8px] text-[#999ca1] dark:text-[#83766e]">
                                  {Math.max(
                                    0,
                                    nextMilestone - player.currentStreak,
                                  )}{" "}
                                  remaining
                                </p>
                              </div>
                            ) : (
                              <span className="text-[9px] font-semibold text-[#168653] dark:text-[#70d7a0]">
                                90+ days
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusBadge status={player.streakStatus} />
                          </td>
                        </tr>
                      );
                    })}

                    {visiblePlayers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center">
                          <div className="mx-auto flex max-w-[280px] flex-col items-center">
                            <Flame
                              size={24}
                              className="text-[#c4c6c9] dark:text-[#594d46]"
                            />

                            <p className="mt-3 text-[11px] font-semibold text-[#55585d] dark:text-[#d7cbc4]">
                              No streak records found
                            </p>

                            <p className="mt-1 text-[9px] text-[#999ca1] dark:text-[#83766e]">
                              Try changing your search or filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-[#eeeeef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#342a24]">
                <p className="text-[9px] text-[#999ca1] dark:text-[#83766e]">
                  {filteredPlayers.length === 0
                    ? "Showing 0 players"
                    : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                        page * PAGE_SIZE,
                        filteredPlayers.length,
                      )} of ${filteredPlayers.length} players`}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#e1e3e6] text-[#777b80] transition hover:border-[#ff6b00] hover:text-[#ff6b00] disabled:opacity-40 dark:border-[#3a302a] dark:text-[#a99d96]"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  <span className="flex h-7 min-w-7 items-center justify-center rounded-[5px] bg-[#ff6b00] px-2 text-[9px] font-bold text-white">
                    {page}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#e1e3e6] text-[#777b80] transition hover:border-[#ff6b00] hover:text-[#ff6b00] disabled:opacity-40 dark:border-[#3a302a] dark:text-[#a99d96]"
                    aria-label="Next page"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
