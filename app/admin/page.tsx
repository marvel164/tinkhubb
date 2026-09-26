import Link from "next/link";
import {
  Activity,
  Bell,
  Clock3,
  Flame,
  Gamepad2,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin/guard";
import AdminShell from "@/components/admin/admin-shell";

type StreakBucket = {
  label: string;
  count: number;
};

type ActivityItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
};

function formatDuration(seconds: number) {
  if (!seconds) return "0m 0s";

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (!minutes) return `${remaining}s`;

  return `${minutes}m ${remaining}s`;
}

function getLagosWeekStart() {
  const now = new Date();

  // Nigeria is UTC+1 year-round.
  const lagosTime = new Date(now.getTime() + 60 * 60 * 1000);

  const day = lagosTime.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  lagosTime.setUTCDate(lagosTime.getUTCDate() - daysSinceMonday);
  lagosTime.setUTCHours(0, 0, 0, 0);

  return new Date(lagosTime.getTime() - 60 * 60 * 1000);
}

function buildStreakBuckets(
  rows: Array<{
    currentStreak: number;
    _count: {
      _all: number;
    };
  }>,
): StreakBucket[] {
  const buckets: StreakBucket[] = [
    { label: "1 - 2 days", count: 0 },
    { label: "3 - 6 days", count: 0 },
    { label: "7 - 13 days", count: 0 },
    { label: "14 - 29 days", count: 0 },
    { label: "30 days", count: 0 },
  ];

  for (const row of rows) {
    const streak = row.currentStreak;
    const count = row._count._all;

    if (streak >= 1 && streak <= 2) {
      buckets[0].count += count;
    } else if (streak >= 3 && streak <= 6) {
      buckets[1].count += count;
    } else if (streak >= 7 && streak <= 13) {
      buckets[2].count += count;
    } else if (streak >= 14 && streak <= 29) {
      buckets[3].count += count;
    } else if (streak >= 30) {
      buckets[4].count += count;
    }
  }

  return buckets;
}

function getPercentChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }

  return ((current - previous) / previous) * 100;
}

function formatPercentChange(value: number) {
  const rounded = Math.round(value * 10) / 10;

  if (rounded === 0) {
    return "0%";
  }

  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m ago`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  }

  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function getActivityIcon(type: string) {
  switch (type) {
    case "SUSPICIOUS_ACTIVITY":
    case "USER_SUSPENDED":
      return (
        <ShieldAlert size={13} strokeWidth={1.8} className="text-[#d98a22]" />
      );

    case "NEW_USER":
      return <Users size={13} strokeWidth={1.8} className="text-[#4c76d8]" />;

    case "QUESTION_IMPORT":
      return (
        <Activity size={13} strokeWidth={1.8} className="text-[#2aa675]" />
      );

    case "ADMIN_TEAM_ACTIVITY":
      return (
        <ShieldAlert size={13} strokeWidth={1.8} className="text-[#8b68d8]" />
      );

    case "LEADERBOARD_TOPPED":
    case "LEADERBOARD_MOVEMENT":
      return <Trophy size={13} strokeWidth={1.8} className="text-[#ff6b00]" />;

    default:
      return <Bell size={13} strokeWidth={1.8} className="text-[#777b80]" />;
  }
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const weekStart = getLagosWeekStart();

  const previousWeekStart = new Date(
    weekStart.getTime() - 7 * 24 * 60 * 60 * 1000,
  );

  const now = new Date();

  const [
    userStatusGroups,
    gameStats,
    weeklyScores,
    streakGroups,
    streakRecords,
    completedStreakRecords,

    currentWeekUsers,
    previousWeekUsers,

    currentWeekGames,
    previousWeekGames,

    currentWeekQuestions,
    previousWeekQuestions,

    currentWeekDuration,
    previousWeekDuration,

    recentActivities,
  ] = await Promise.all([
    /*
     * Total users.
     */
    prisma.user.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    /*
     * All-time game statistics.
     */
    prisma.gameSession.aggregate({
      where: {
        status: "COMPLETED",
      },
      _count: {
        _all: true,
      },
      _sum: {
        questionsAnswered: true,
      },
      _avg: {
        durationSeconds: true,
      },
    }),

    /*
     * Weekly leaderboard.
     */
    prisma.gameSession.groupBy({
      by: ["userId"],
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: weekStart,
        },
      },
      _sum: {
        score: true,
      },
      orderBy: {
        _sum: {
          score: "desc",
        },
      },
      take: 5,
    }),

    /*
     * Current streak distribution.
     */
    prisma.user.groupBy({
      by: ["currentStreak"],
      where: {
        status: "ACTIVE",
        currentStreak: {
          gt: 0,
        },
      },
      _count: {
        _all: true,
      },
    }),

    /*
     * Streak completion statistics.
     */
    prisma.streakRecord.count(),

    prisma.streakRecord.count({
      where: {
        completedGame: true,
      },
    }),

    /*
     * Weekly user acquisition.
     */
    prisma.user.count({
      where: {
        createdAt: {
          gte: weekStart,
          lt: now,
        },
      },
    }),

    prisma.user.count({
      where: {
        createdAt: {
          gte: previousWeekStart,
          lt: weekStart,
        },
      },
    }),

    /*
     * Weekly completed games.
     */
    prisma.gameSession.count({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: weekStart,
          lt: now,
        },
      },
    }),

    prisma.gameSession.count({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: previousWeekStart,
          lt: weekStart,
        },
      },
    }),

    /*
     * Weekly questions answered.
     */
    prisma.gameSession.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: weekStart,
          lt: now,
        },
      },
      _sum: {
        questionsAnswered: true,
      },
    }),

    prisma.gameSession.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: previousWeekStart,
          lt: weekStart,
        },
      },
      _sum: {
        questionsAnswered: true,
      },
    }),

    /*
     * Weekly average session duration.
     */
    prisma.gameSession.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: weekStart,
          lt: now,
        },
      },
      _avg: {
        durationSeconds: true,
      },
    }),

    prisma.gameSession.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: previousWeekStart,
          lt: weekStart,
        },
      },
      _avg: {
        durationSeconds: true,
      },
    }),

    /*
     * Recent admin/system activity.
     *
     * This intentionally uses the existing AdminNotification model
     * rather than assuming a separate AdminAuditLog schema.
     */
    prisma.adminNotification.findMany({
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  /*
   * Primary totals.
   */
  const totalUsers = userStatusGroups
    .filter((group) => group.status !== "DELETED")
    .reduce((total, group) => total + group._count._all, 0);

  const answeredQuestions = gameStats._sum.questionsAnswered ?? 0;
  const completedGames = gameStats._count._all;
  const averageDuration = Math.round(gameStats._avg.durationSeconds ?? 0);

  /*
   * Weekly metric values.
   */
  const weeklyQuestionsAnswered =
    currentWeekQuestions._sum.questionsAnswered ?? 0;

  const previousWeeklyQuestionsAnswered =
    previousWeekQuestions._sum.questionsAnswered ?? 0;

  const weeklyAverageDuration = Math.round(
    currentWeekDuration._avg.durationSeconds ?? 0,
  );

  const previousWeeklyAverageDuration = Math.round(
    previousWeekDuration._avg.durationSeconds ?? 0,
  );

  /*
   * Percentage trends.
   *
   * Total Users = new users this week vs previous week.
   * Games Played = completed games this week vs previous week.
   * Questions Answered = questions answered this week vs previous week.
   * Avg Session Duration = weekly average vs previous weekly average.
   */
  const userTrend = getPercentChange(currentWeekUsers, previousWeekUsers);

  const gamesTrend = getPercentChange(currentWeekGames, previousWeekGames);

  const questionsTrend = getPercentChange(
    weeklyQuestionsAnswered,
    previousWeeklyQuestionsAnswered,
  );

  const durationTrend = getPercentChange(
    weeklyAverageDuration,
    previousWeeklyAverageDuration,
  );

  /*
   * Streak chart.
   */
  const streakBuckets = buildStreakBuckets(streakGroups);

  const usersWith30DayStreak =
    streakBuckets.find((bucket) => bucket.label === "30 days")?.count ?? 0;

  const longestActiveStreak =
    streakGroups.length > 0
      ? Math.max(...streakGroups.map((group) => group.currentStreak))
      : 0;

  const streakCompletionRate =
    streakRecords > 0
      ? Math.round((completedStreakRecords / streakRecords) * 1000) / 10
      : 0;

  /*
   * Weekly leaderboard users.
   */
  const weeklyUserIds = weeklyScores.map((entry) => entry.userId);

  const weeklyUsers =
    weeklyUserIds.length > 0
      ? await prisma.user.findMany({
          where: {
            id: {
              in: weeklyUserIds,
            },
            status: "ACTIVE",
          },
          select: {
            id: true,
            username: true,
            currentStreak: true,
          },
        })
      : [];

  const weeklyUserMap = new Map(weeklyUsers.map((user) => [user.id, user]));

  const leaderboard = weeklyScores
    .map((entry) => {
      const user = weeklyUserMap.get(entry.userId);

      if (!user) return null;

      return {
        id: user.id,
        username: user.username,
        points: entry._sum.score ?? 0,
        streak: user.currentStreak,
      };
    })
    .filter(
      (
        player,
      ): player is {
        id: string;
        username: string;
        points: number;
        streak: number;
      } => player !== null,
    )
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      return a.username.localeCompare(b.username);
    });

  return (
    <AdminShell
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
      active="dashboard"
    >
      <main className="min-h-[calc(100vh-64px)] bg-[#f5f6f8] px-4 py-6 sm:px-5 md:px-7 md:py-7 dark:bg-[#15120f]">
        <div className="mx-auto max-w-[1280px]">
          {/* Heading */}
          <section>
            <h1 className="text-[23px] font-bold tracking-[-0.04em] text-[#171717] sm:text-[25px] dark:text-[#fff4ec]">
              Dashboard Overview
            </h1>

            <p className="mt-1 text-[10px] text-[#777b80] sm:text-[11px] dark:text-[#a99d96]">
              Real-time performance monitoring for Tinkhupp Trivia platform.
            </p>
          </section>

          {/* Primary metrics */}
          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Users"
              value={totalUsers}
              trend={userTrend}
              icon={<Users size={17} strokeWidth={1.8} />}
              iconClassName="bg-[#fff0e5] text-[#ff6b00] dark:bg-[#35231a] dark:text-[#ffb27a]"
            />

            <MetricCard
              label="Games Played"
              value={completedGames}
              trend={gamesTrend}
              icon={<Gamepad2 size={17} strokeWidth={1.8} />}
              iconClassName="bg-[#eef3ff] text-[#5279d9] dark:bg-[#202b45] dark:text-[#8da9ff]"
            />

            <MetricCard
              label="Questions Answered"
              value={answeredQuestions}
              trend={questionsTrend}
              icon={<Activity size={17} strokeWidth={1.8} />}
              iconClassName="bg-[#eafaf3] text-[#29a873] dark:bg-[#19372c] dark:text-[#72d6a9]"
            />

            <MetricCard
              label="Avg Session Duration"
              value={formatDuration(averageDuration)}
              trend={durationTrend}
              icon={<Clock3 size={17} strokeWidth={1.8} />}
              iconClassName="bg-[#f3efff] text-[#8b68d8] dark:bg-[#30264a] dark:text-[#b69aff]"
            />
          </section>

          {/* Daily streak statistics */}
          <section className="mt-5 overflow-hidden rounded-[7px] border border-[#e5e7ea] bg-white dark:border-[#332a25] dark:bg-[#1c1815]">
            <div className="flex items-start justify-between px-5 pb-2 pt-5 sm:px-6">
              <div>
                <h2 className="text-[13px] font-bold text-[#222] dark:text-[#fff4ec]">
                  Daily Streak Statistics
                </h2>

                <p className="mt-1 text-[9px] text-[#898d92] dark:text-[#a69d96]">
                  Users by current streak length
                </p>
              </div>

              <Link
                href="/admin/streaks"
                className="text-[9px] font-semibold text-[#ff6b00] transition-colors hover:text-[#e96000]"
              >
                View all
              </Link>
            </div>

            <div className="px-5 pt-6 sm:px-6 sm:pt-7">
              <div className="grid h-[190px] grid-cols-5 items-end gap-2 border-b border-[#dedfe1] pb-0 sm:gap-4 dark:border-[#40352e]">
                {streakBuckets.map((bucket) => {
                  const maximum = Math.max(
                    ...streakBuckets.map((item) => item.count),
                    1,
                  );

                  const height =
                    bucket.count === 0
                      ? 4
                      : Math.max(
                          12,
                          Math.round((bucket.count / maximum) * 155),
                        );

                  return (
                    <div
                      key={bucket.label}
                      className="flex min-w-0 h-full flex-col items-center justify-end"
                    >
                      <span className="mb-2 text-[7px] font-medium text-[#73777d] sm:text-[8px] dark:text-[#aaa098]">
                        {bucket.count.toLocaleString()}
                      </span>

                      <div
                        className="w-full max-w-[125px] rounded-t-[14px] bg-[#ffab35]"
                        style={{ height }}
                        aria-label={`${bucket.count} users with ${bucket.label}`}
                      />

                      <span className="mt-2 whitespace-nowrap text-[7px] text-[#73777d] sm:text-[8px] dark:text-[#aaa098]">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 px-5 py-6 sm:grid-cols-3 sm:px-6">
              <StreakSummary
                value={usersWith30DayStreak}
                label="Users with 30-day streak"
              />

              <StreakSummary
                value={`${longestActiveStreak} days`}
                label="Longest active streak"
              />

              <StreakSummary
                value={`${streakCompletionRate}%`}
                label="Streak completion rate"
              />
            </div>
          </section>

          {/* Leaderboard overview */}
          <section className="mt-5 overflow-hidden rounded-[7px] border border-[#e5e7ea] bg-white dark:border-[#332a25] dark:bg-[#1c1815]">
            <div className="flex items-center justify-between border-b border-[#eeeeef] px-5 py-5 sm:px-6 dark:border-[#332a25]">
              <div>
                <h2 className="text-[13px] font-bold text-[#222] dark:text-[#fff4ec]">
                  Leaderboard Overview
                </h2>

                <p className="mt-1 text-[9px] text-[#898d92] dark:text-[#8f8781]">
                  Top players this week
                </p>
              </div>

              <Link
                href="/admin/leaderboard"
                className="text-[9px] font-semibold text-[#ff6b00] transition-colors hover:text-[#e96000]"
              >
                Manage
              </Link>
            </div>

            {leaderboard.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Trophy
                  size={22}
                  className="mx-auto text-[#c9cbce] dark:text-[#625951]"
                />

                <p className="mt-3 text-[10px] font-semibold text-[#666] dark:text-[#c5bbb4]">
                  No weekly leaderboard activity yet.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop / tablet table */}
                <div className="hidden overflow-x-auto sm:block">
                  <div className="min-w-[560px]">
                    <div className="grid grid-cols-[58px_1fr_130px_90px] border-b border-[#f0f1f2] px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.06em] text-[#96999e] dark:border-[#302823] dark:text-[#8f8781]">
                      <span>Rank</span>
                      <span>Player</span>
                      <span className="text-right">Points</span>
                      <span className="text-right">Streak</span>
                    </div>

                    {leaderboard.map((player, index) => (
                      <div
                        key={player.id}
                        className={[
                          "grid grid-cols-[58px_1fr_130px_90px] items-center px-5 py-4",
                          index !== leaderboard.length - 1
                            ? "border-b border-[#f0f1f2] dark:border-[#302823]"
                            : "",
                        ].join(" ")}
                      >
                        <span className="text-[10px] font-bold text-[#ff6b00]">
                          #{index + 1}
                        </span>

                        <span className="truncate text-[10px] font-semibold text-[#333] dark:text-[#f5e9e1]">
                          {player.username}
                        </span>

                        <span className="text-right text-[10px] font-semibold text-[#555] dark:text-[#ddd2cb]">
                          {player.points.toLocaleString()} pts
                        </span>

                        <span className="flex items-center justify-end gap-1.5 text-[10px] font-semibold text-[#555] dark:text-[#ddd2cb]">
                          <Flame
                            size={12}
                            className="text-[#ff6b00]"
                            fill="currentColor"
                          />
                          {player.streak}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className={[
                        "flex items-center gap-3 px-5 py-4",
                        index !== leaderboard.length - 1
                          ? "border-b border-[#f0f1f2] dark:border-[#302823]"
                          : "",
                      ].join(" ")}
                    >
                      <span className="w-7 shrink-0 text-[10px] font-bold text-[#ff6b00]">
                        #{index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold text-[#333] dark:text-[#f5e9e1]">
                          {player.username}
                        </p>

                        <p className="mt-1 text-[8px] text-[#96999e] dark:text-[#8f8781]">
                          {player.points.toLocaleString()} points
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-[#555] dark:text-[#ddd2cb]">
                        <Flame
                          size={12}
                          className="text-[#ff6b00]"
                          fill="currentColor"
                        />
                        {player.streak}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Recent Admin Activity */}
          <section className="mt-5 overflow-hidden rounded-[7px] border border-[#e5e7ea] bg-white dark:border-[#332a25] dark:bg-[#1c1815]">
            <div className="flex items-center justify-between border-b border-[#eeeeef] px-5 py-5 sm:px-6 dark:border-[#332a25]">
              <div>
                <h2 className="text-[13px] font-bold text-[#222] dark:text-[#fff4ec]">
                  Recent Admin Activity
                </h2>

                <p className="mt-1 text-[9px] text-[#898d92] dark:text-[#8f8781]">
                  Recent platform and administrative activity
                </p>
              </div>

              <Link
                href="/admin/notifications"
                className="text-[9px] font-semibold text-[#ff6b00] transition-colors hover:text-[#e96000]"
              >
                View all
              </Link>
            </div>

            {recentActivities.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Bell
                  size={22}
                  className="mx-auto text-[#c9cbce] dark:text-[#625951]"
                />

                <p className="mt-3 text-[10px] font-semibold text-[#666] dark:text-[#c5bbb4]">
                  No recent admin activity yet.
                </p>
              </div>
            ) : (
              <div>
                {recentActivities.map(
                  (activity: ActivityItem, index: number) => (
                    <div
                      key={activity.id}
                      className={[
                        "flex items-start gap-3 px-5 py-4 sm:px-6",
                        index !== recentActivities.length - 1
                          ? "border-b border-[#f0f1f2] dark:border-[#302823]"
                          : "",
                      ].join(" ")}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f7f7f8] dark:bg-[#28211d]">
                        {getActivityIcon(activity.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <p className="truncate text-[10px] font-semibold text-[#333] dark:text-[#f5e9e1]">
                            {activity.title}
                          </p>

                          <span className="shrink-0 text-[8px] text-[#96999e] dark:text-[#8f8781]">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-[9px] leading-[1.45] text-[#777b80] dark:text-[#aaa098]">
                          {activity.message}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}

function MetricCard({
  label,
  value,
  trend,
  icon,
  iconClassName,
}: {
  label: string;
  value: number | string;
  trend: number;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  const isPositive = trend >= 0;

  return (
    <div className="min-h-[134px] rounded-[7px] border border-[#e5e7ea] bg-white px-5 py-5 dark:border-[#332a25] dark:bg-[#1c1815]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-medium text-[#777b80] dark:text-[#aaa098]">
            {label}
          </p>

          <p className="mt-3 truncate text-[24px] font-bold tracking-[-0.045em] text-[#222] sm:text-[25px] dark:text-[#fff4ec]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>

        <div
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]",
            iconClassName,
          ].join(" ")}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <span
          className={[
            "rounded-[4px] px-2 py-1 text-[7px] font-semibold",
            isPositive
              ? "bg-[#eaf8f1] text-[#38a778] dark:bg-[#19372c] dark:text-[#72d6a9]"
              : "bg-[#fff0ef] text-[#d75d55] dark:bg-[#3a211f] dark:text-[#f08d85]",
          ].join(" ")}
        >
          {formatPercentChange(trend)} vs last week
        </span>
      </div>
    </div>
  );
}

function StreakSummary({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div>
      <p className="text-[21px] font-bold tracking-[-0.04em] text-[#222] dark:text-[#fff4ec]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>

      <p className="mt-1 text-[8px] text-[#777b80] dark:text-[#aaa098]">
        {label}
      </p>
    </div>
  );
}
