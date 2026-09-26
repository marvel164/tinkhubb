import Link from "next/link";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Flame,
  Search,
  Trophy,
  Users,
} from "lucide-react";

import type { Prisma } from "@/app/generated/prisma/client";

import AdminShell from "@/components/admin/admin-shell";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin/guard";

const PAGE_SIZE = 10;

const STATUSES = ["ALL", "ACTIVE", "SUSPENDED"] as const;

const SORTS = [
  "points-desc",
  "points-asc",
  "username-asc",
  "username-desc",
  "streak-desc",
  "streak-asc",
  "games-desc",
  "games-asc",
] as const;

type StatusFilter = (typeof STATUSES)[number];
type SortKey = (typeof SORTS)[number];

type Props = {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    sort?: string;
  }>;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

function pageHref(
  page: number,
  status: StatusFilter,
  search: string,
  sort: SortKey,
) {
  const params = new URLSearchParams({
    page: String(page),
    status,
    sort,
  });

  if (search) {
    params.set("search", search);
  }

  return `/admin/leaderboard?${params.toString()}`;
}

export default async function AdminLeaderboardPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const status = STATUSES.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "ALL";

  const sort = SORTS.includes(params.sort as SortKey)
    ? (params.sort as SortKey)
    : "points-desc";

  const search = (params.search ?? "").trim();

  const requestedPage = Number(params.page ?? "1");

  const requested =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const baseWhere: Prisma.UserWhereInput = {
    status: {
      in: ["ACTIVE", "SUSPENDED"],
    },
  };

  const where: Prisma.UserWhereInput = {
    ...baseWhere,

    ...(status === "ALL"
      ? {}
      : {
          status,
        }),

    ...(search
      ? {
          username: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const orderBy =
    sort === "username-asc"
      ? [{ username: "asc" as const }]
      : sort === "username-desc"
        ? [{ username: "desc" as const }]
        : sort === "points-asc"
          ? [
              { totalPoints: "asc" as const },
              { totalPointsReachedAt: "asc" as const },
              { username: "asc" as const },
            ]
          : sort === "streak-desc"
            ? [{ currentStreak: "desc" as const }, { username: "asc" as const }]
            : sort === "streak-asc"
              ? [
                  { currentStreak: "asc" as const },
                  { username: "asc" as const },
                ]
              : sort === "games-desc"
                ? [
                    { gamesPlayed: "desc" as const },
                    { username: "asc" as const },
                  ]
                : sort === "games-asc"
                  ? [
                      { gamesPlayed: "asc" as const },
                      { username: "asc" as const },
                    ]
                  : [
                      { totalPoints: "desc" as const },
                      { totalPointsReachedAt: "asc" as const },
                      { username: "asc" as const },
                    ];

  const [
    rankedPlayers,
    topScore,
    averagePoints,
    topClimber,
    totalEntries,
    players,
  ] = await Promise.all([
    prisma.user.count({
      where: baseWhere,
    }),

    prisma.user.aggregate({
      where: baseWhere,
      _max: {
        totalPoints: true,
      },
    }),

    prisma.user.aggregate({
      where: baseWhere,
      _avg: {
        totalPoints: true,
      },
    }),

    prisma.user.findFirst({
      where: baseWhere,
      orderBy: [
        {
          totalPoints: "desc",
        },
        {
          totalPointsReachedAt: "asc",
        },
        {
          username: "asc",
        },
      ],
      select: {
        username: true,
      },
    }),

    prisma.user.count({
      where,
    }),

    prisma.user.findMany({
      where,
      orderBy,
      skip: (requested - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        username: true,
        totalPoints: true,
        currentStreak: true,
        gamesPlayed: true,
        status: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const page = Math.min(requested, totalPages);

  const first = totalEntries ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, totalEntries);

  return (
    <AdminShell
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
      active="leaderboard"
    >
      <main className="min-h-[calc(100vh-76px)] bg-[#f5f6f8] px-4 py-6 md:px-7 md:py-7 dark:bg-[#15120f]">
        <div className="mx-auto max-w-[1280px]">
          {/* Page header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[25px] font-bold tracking-[-0.035em] text-[#171717] dark:text-[#fff4ec]">
                Leaderboard
              </h1>

              <p className="mt-1 text-[12px] text-[#777b80] dark:text-[#a99d96]">
                View player rankings
              </p>
            </div>

            <a
              href="/api/admin/users/leaderboard-export"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[7px] bg-[#ff6b00] px-5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#eb6100] sm:w-auto"
            >
              <Download size={14} strokeWidth={2.2} />
              Export
            </a>
          </header>

          {/* Summary */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Users size={16} />}
              label="Ranked Players"
              value={formatNumber(rankedPlayers)}
            />

            <StatCard
              icon={<Trophy size={16} />}
              label="Top Score"
              value={formatNumber(topScore._max?.totalPoints ?? 0)}
            />

            <StatCard
              icon={<Trophy size={16} />}
              label="Average Points"
              value={formatNumber(
                Math.round(averagePoints._avg?.totalPoints ?? 0),
              )}
            />

            <StatCard
              icon={<ArrowDownUp size={16} />}
              label="Top Climber of Leaderboard"
              value={topClimber?.username ?? "—"}
              compact
            />
          </section>

          {/* Leaderboard card */}
          <section className="mt-5 overflow-hidden rounded-[9px] border border-[#e5e7ea] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-[#2c2622] dark:bg-[#1d1916]">
            {/* Controls */}
            <div className="border-b border-[#eceef1] px-4 pt-4 dark:border-[#302925] md:px-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                {/* Status tabs */}
                <nav className="flex w-fit items-center gap-0 border-b border-[#e5e7ea] dark:border-[#302925]">
                  {STATUSES.map((item) => {
                    const active = status === item;

                    return (
                      <Link
                        key={item}
                        href={pageHref(1, item, search, sort)}
                        className={`relative px-4 pb-3 pt-1 text-[11px] font-medium transition ${
                          active
                            ? "text-[#ff6b00]"
                            : "text-[#85898e] hover:text-[#4e5155] dark:text-[#9d938d] dark:hover:text-[#eee5df]"
                        }`}
                      >
                        {item[0] + item.slice(1).toLowerCase()}

                        {active && (
                          <span className="absolute bottom-[-1px] left-3 right-3 h-[2px] rounded-full bg-[#ff6b00]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Search / sort */}
                <form
                  method="get"
                  className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto"
                >
                  <input type="hidden" name="status" value={status} />

                  <label className="relative block w-full sm:w-[225px]">
                    <Search
                      size={14}
                      strokeWidth={2}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a5aa]"
                    />

                    <input
                      name="search"
                      defaultValue={search}
                      placeholder="Search..."
                      className="h-9 w-full rounded-[6px] border border-[#dfe2e5] bg-white pl-9 pr-3 text-[11px] text-[#333] outline-none transition placeholder:text-[#a1a5aa] focus:border-[#ff6b00] dark:border-[#39322e] dark:bg-[#211c19] dark:text-[#f7eee8]"
                    />
                  </label>

                  <select
                    name="sort"
                    defaultValue={sort}
                    aria-label="Sort leaderboard"
                    className="h-9 w-full rounded-[6px] border border-[#dfe2e5] bg-white px-3 text-[11px] text-[#55585d] outline-none focus:border-[#ff6b00] sm:w-[170px] dark:border-[#39322e] dark:bg-[#211c19] dark:text-[#d8cec8]"
                  >
                    <option value="points-desc">Points: High to Low</option>
                    <option value="points-asc">Points: Low to High</option>
                    <option value="username-asc">Username: A–Z</option>
                    <option value="username-desc">Username: Z–A</option>
                    <option value="streak-desc">Streak: High to Low</option>
                    <option value="streak-asc">Streak: Low to High</option>
                    <option value="games-desc">Games: High to Low</option>
                    <option value="games-asc">Games: Low to High</option>
                  </select>

                  <button
                    type="submit"
                    className="h-9 rounded-[6px] border border-[#dfe2e5] bg-white px-4 text-[11px] font-medium text-[#55585d] transition hover:border-[#ff6b00] hover:text-[#ff6b00] dark:border-[#39322e] dark:bg-[#211c19] dark:text-[#d8cec8]"
                  >
                    Apply
                  </button>
                </form>
              </div>

              {/* Table header */}
              <div className="mt-4 overflow-hidden rounded-t-[6px]">
                <div className="grid min-w-[780px] grid-cols-[70px_minmax(180px,1.7fr)_1fr_1fr_1fr_110px_65px] bg-[#f7f7f8] px-3 py-3 text-[9px] font-semibold uppercase tracking-[0.025em] text-[#7d8186] dark:bg-[#28231f] dark:text-[#aaa09a]">
                  <HeaderCell label="Rank" />
                  <HeaderCell label="Username" />
                  <HeaderCell label="Points" />
                  <HeaderCell label="Streak" />
                  <HeaderCell label="Games" />
                  <HeaderCell label="Status" />
                  <HeaderCell label="Action" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto px-4 md:px-5">
              <div className="min-w-[780px]">
                {players.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center text-[12px] text-[#85898e] dark:text-[#aaa09a]">
                    No players found.
                  </div>
                ) : (
                  players.map((player, index) => {
                    const rank = (page - 1) * PAGE_SIZE + index + 1;
                    const isFirst = rank === 1;

                    return (
                      <div
                        key={player.id}
                        className={`grid min-h-[58px] grid-cols-[70px_minmax(180px,1.7fr)_1fr_1fr_1fr_110px_65px] items-center border-b border-[#eceef1] px-3 text-[11px] transition last:border-b-0 dark:border-[#302925] ${
                          isFirst
                            ? "my-1 rounded-[7px] border-b-0 bg-[#fff5ed] dark:bg-[#35241a]"
                            : "hover:bg-[#fafafa] dark:hover:bg-[#211d1a]"
                        }`}
                      >
                        <div
                          className={`font-semibold ${
                            isFirst
                              ? "text-[#ff6b00]"
                              : "text-[#777b80] dark:text-[#aaa09a]"
                          }`}
                        >
                          #{rank}
                        </div>

                        <div className="truncate pr-3 font-medium text-[#2d2d2d] dark:text-[#f2e9e4]">
                          {player.username}
                        </div>

                        <div className="font-medium text-[#3b3b3b] dark:text-[#e4d9d3]">
                          {formatNumber(player.totalPoints)}
                        </div>

                        <div className="flex items-center gap-1.5 font-medium text-[#3b3b3b] dark:text-[#e4d9d3]">
                          <Flame
                            size={14}
                            strokeWidth={2.2}
                            className="text-[#ff6b00]"
                            fill="currentColor"
                          />
                          {formatNumber(player.currentStreak)}
                        </div>

                        <div className="font-medium text-[#3b3b3b] dark:text-[#e4d9d3]">
                          {formatNumber(player.gamesPlayed)}
                        </div>

                        <div>
                          <StatusBadge status={player.status} />
                        </div>

                        <div>
                          <Link
                            href={`/admin/users?search=${encodeURIComponent(
                              player.username,
                            )}`}
                            aria-label={`Manage ${player.username}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[11px] font-semibold tracking-[1px] text-[#8a8e93] transition hover:bg-[#f1f2f3] hover:text-[#ff6b00] dark:hover:bg-[#302925]"
                          >
                            •••
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pagination */}
            <footer className="flex flex-col gap-3 border-t border-[#eceef1] px-4 py-4 text-[10px] text-[#777b80] dark:border-[#302925] dark:text-[#aaa09a] md:flex-row md:items-center md:justify-between md:px-5">
              <span>
                Showing {first}-{last} of {formatNumber(totalEntries)} entries
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <PageLink
                  href={pageHref(1, status, search, sort)}
                  disabled={page <= 1}
                >
                  <ChevronsLeft size={14} />
                </PageLink>

                <PageLink
                  href={pageHref(Math.max(1, page - 1), status, search, sort)}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={14} />
                </PageLink>

                {getPages(page, totalPages).map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-[#8c9095]"
                    >
                      …
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={pageHref(item, status, search, sort)}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-[6px] px-2 text-[10px] transition ${
                        page === item
                          ? "bg-[#ff6b00] font-semibold text-white"
                          : "text-[#666a6f] hover:bg-[#f2f3f5] hover:text-[#ff6b00] dark:text-[#aaa09a] dark:hover:bg-[#302925]"
                      }`}
                    >
                      {item}
                    </Link>
                  ),
                )}

                <PageLink
                  href={pageHref(
                    Math.min(totalPages, page + 1),
                    status,
                    search,
                    sort,
                  )}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={14} />
                </PageLink>

                <PageLink
                  href={pageHref(totalPages, status, search, sort)}
                  disabled={page >= totalPages}
                >
                  <ChevronsRight size={14} />
                </PageLink>

                <span className="ml-1 rounded-[6px] border border-[#e1e3e6] px-3 py-2 dark:border-[#39322e]">
                  10 Entries
                </span>
              </div>
            </footer>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="flex min-h-[92px] items-center gap-3 rounded-[8px] border border-[#e5e7ea] bg-white px-4 py-4 dark:border-[#2c2622] dark:bg-[#1d1916]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#fff1e7] text-[#ff6b00] dark:bg-[#39261b]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] text-[#85898e] dark:text-[#aaa09a]">
          {label}
        </p>

        <p
          className={`mt-1 truncate font-bold tracking-[-0.03em] text-[#252525] dark:text-[#f6ede8] ${
            compact ? "text-[17px]" : "text-[22px]"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <ArrowDownUp size={9} strokeWidth={2.4} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium ${
        active
          ? "bg-[#e6f8f0] text-[#20a873] dark:bg-[#17372b] dark:text-[#63d9a7]"
          : "bg-[#fff0e7] text-[#d76a19] dark:bg-[#3a281c] dark:text-[#f1a063]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[#28bd83]" : "bg-[#e88a45]"
        }`}
      />

      {active ? "Active" : "Suspended"}
    </span>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#e1e3e6] text-[#9da1a6] opacity-40 dark:border-[#39322e]">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#e1e3e6] text-[#70747a] transition hover:border-[#ff6b00] hover:text-[#ff6b00] dark:border-[#39322e] dark:text-[#aaa09a]"
    >
      {children}
    </Link>
  );
}

function getPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }

  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}
