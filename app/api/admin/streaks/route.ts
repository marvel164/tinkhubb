import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const LAGOS_TIME_ZONE = "Africa/Lagos";

function getDateKey(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getTodayKey() {
  return getDateKey(new Date());
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const todayKey = getTodayKey();

    const users = await prisma.user.findMany({
      where: {
        status: {
          in: ["ACTIVE", "SUSPENDED"],
        },
      },
      orderBy: [
        {
          currentStreak: "desc",
        },
        {
          longestStreak: "desc",
        },
        {
          username: "asc",
        },
      ],
      select: {
        id: true,
        username: true,
        currentStreak: true,
        longestStreak: true,
        lastPlayedDate: true,
        status: true,
        createdAt: true,
      },
    });

    const activeUsers = users.filter((user) => user.status === "ACTIVE");

    const activeStreakUsers = activeUsers.filter(
      (user) => user.currentStreak > 0,
    );

    const longestStreak = activeUsers.reduce(
      (highest, user) =>
        Math.max(highest, user.longestStreak, user.currentStreak),
      0,
    );

    const usersWith30DayStreak = activeUsers.filter(
      (user) => user.currentStreak >= 30,
    ).length;

    const streaksCompletedToday = activeStreakUsers.filter(
      (user) => getDateKey(user.lastPlayedDate) === todayKey,
    ).length;

    const streaksAtRiskToday = activeStreakUsers.filter(
      (user) => getDateKey(user.lastPlayedDate) !== todayKey,
    ).length;

    const streakCompletionRate =
      activeStreakUsers.length > 0
        ? Math.round((streaksCompletedToday / activeStreakUsers.length) * 100)
        : 0;

    const distribution = {
      "1-2": 0,
      "3-6": 0,
      "7-13": 0,
      "14-29": 0,
      "30": 0,
      "31+": 0,
    };

    for (const user of activeStreakUsers) {
      const streak = user.currentStreak;

      if (streak <= 2) {
        distribution["1-2"] += 1;
      } else if (streak <= 6) {
        distribution["3-6"] += 1;
      } else if (streak <= 13) {
        distribution["7-13"] += 1;
      } else if (streak <= 29) {
        distribution["14-29"] += 1;
      } else if (streak === 30) {
        distribution["30"] += 1;
      } else {
        distribution["31+"] += 1;
      }
    }

    const milestones = [7, 14, 30, 60, 90].map((milestone) => {
      const reached = activeUsers.filter(
        (user) => user.currentStreak >= milestone,
      ).length;

      return {
        milestone,
        reached,
        totalActiveStreaks: activeStreakUsers.length,
        percentage:
          activeStreakUsers.length > 0
            ? Math.round((reached / activeStreakUsers.length) * 100)
            : 0,
      };
    });

    const formattedUsers = users.map((user) => {
      const lastPlayedKey = getDateKey(user.lastPlayedDate);

      return {
        id: user.id,
        username: user.username,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastPlayedDate: user.lastPlayedDate,
        lastPlayedKey,
        status: user.status,
        streakStatus:
          user.currentStreak > 0 && lastPlayedKey !== todayKey
            ? "AT_RISK"
            : "ON_TRACK",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        today: todayKey,
        users: formattedUsers,
        stats: {
          longestStreak,
          usersWith30DayStreak,
          activeStreaks: activeStreakUsers.length,
          streaksAtRiskToday,
          streaksCompletedToday,
          streakCompletionRate,
        },
        distribution,
        milestones,
      },
    });
  } catch (error) {
    console.error("Admin streaks error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load streak information.",
      },
      { status: 500 },
    );
  }
}
