import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const WEEK_TIMEZONE = "Africa/Lagos";

function getStartOfWeekInLagos() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: WEEK_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    },
  );

  const parts = formatter.formatToParts(now);

  const year = Number(
    parts.find(
      (part) => part.type === "year",
    )?.value,
  );

  const month = Number(
    parts.find(
      (part) => part.type === "month",
    )?.value,
  );

  const day = Number(
    parts.find(
      (part) => part.type === "day",
    )?.value,
  );

  const weekday =
    parts.find(
      (part) => part.type === "weekday",
    )?.value ?? "Mon";

  const weekdayIndex: Record<
    string,
    number
  > = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const currentDay =
    weekdayIndex[weekday] ?? 1;

  const daysFromMonday =
    currentDay === 0
      ? 6
      : currentDay - 1;

  /*
   * Africa/Lagos is UTC+1 with no DST.
   * Monday 00:00 Lagos = Sunday 23:00 UTC.
   */
  const mondayUtcMillis =
    Date.UTC(
      year,
      month - 1,
      day - daysFromMonday,
      0,
      0,
      0,
    ) -
    60 * 60 * 1000;

  return new Date(mondayUtcMillis);
}

export async function GET() {
  try {
    const currentUser =
      await getCurrentUser();

    /*
     * GLOBAL LEADERBOARD
     *
     * totalPoints = lifetime points.
     */
    const users =
      await prisma.user.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          username: true,
          totalPoints: true,
          totalPointsReachedAt: true,
          currentStreak: true,
        },
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
      });

    const globalLeaderboard =
      users.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        username: user.username,
        totalPoints: user.totalPoints,
        dailyStreak: user.currentStreak,
      }));

    /*
     * WEEKLY LEADERBOARD
     *
     * weeklyPoints = points earned from completed
     * games during the current Lagos week.
     */
    const weeklyStart =
      getStartOfWeekInLagos();

    const weeklyGames =
      await prisma.gameSession.findMany({
        where: {
          status: "COMPLETED",

          completedAt: {
            gte: weeklyStart,
          },

          user: {
            status: "ACTIVE",
          },
        },

        select: {
          userId: true,
          score: true,
          completedAt: true,

          user: {
            select: {
              id: true,
              username: true,
              totalPoints: true,
              currentStreak: true,
            },
          },
        },
      });

    const weeklyMap = new Map<
      string,
      {
        id: string;
        username: string;
        weeklyPoints: number;
        totalPoints: number;
        dailyStreak: number;
        firstCompletionAt: Date;
      }
    >();

    for (const game of weeklyGames) {
      const existing =
        weeklyMap.get(game.userId);

      const completionTime =
        game.completedAt ??
        new Date(0);

      if (existing) {
        existing.weeklyPoints +=
          game.score;

        if (
          completionTime <
          existing.firstCompletionAt
        ) {
          existing.firstCompletionAt =
            completionTime;
        }
      } else {
        weeklyMap.set(game.userId, {
          id: game.user.id,
          username: game.user.username,
          weeklyPoints: game.score,
          totalPoints:
            game.user.totalPoints,
          dailyStreak:
            game.user.currentStreak,
          firstCompletionAt:
            completionTime,
        });
      }
    }

    const weeklyLeaderboard =
      Array.from(weeklyMap.values())
        .sort((a, b) => {
          if (
            b.weeklyPoints !==
            a.weeklyPoints
          ) {
            return (
              b.weeklyPoints -
              a.weeklyPoints
            );
          }

          if (
            a.firstCompletionAt.getTime() !==
            b.firstCompletionAt.getTime()
          ) {
            return (
              a.firstCompletionAt.getTime() -
              b.firstCompletionAt.getTime()
            );
          }

          return a.username.localeCompare(
            b.username,
          );
        })
        .slice(0, 3)
        .map((player, index) => ({
          rank: index + 1,
          id: player.id,
          username: player.username,

          /*
           * Keep totalPoints for compatibility
           * with existing consumers, but explicitly
           * expose weeklyPoints so the UI does not
           * confuse the two metrics.
           */
          totalPoints:
            player.weeklyPoints,

          weeklyPoints:
            player.weeklyPoints,

          lifetimePoints:
            player.totalPoints,

          dailyStreak:
            player.dailyStreak,
        }));

    const currentUserEntry =
      currentUser
        ? globalLeaderboard.find(
            (player) =>
              player.id ===
              currentUser.id,
          ) ?? null
        : null;

    return NextResponse.json({
      weekly: weeklyLeaderboard,
      global: globalLeaderboard,

      currentUser:
        currentUserEntry,

      totalPlayers:
        globalLeaderboard.length,

      updatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Leaderboard error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to load leaderboard.",
      },
      {
        status: 500,
      },
    );
  }
}
