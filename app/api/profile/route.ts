import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to view your profile.",
        },
        { status: 401 },
      );
    }

    const [usersAhead, recentGames, completedGames] = await Promise.all([
      prisma.user.count({
        where: {
          status: "ACTIVE",
          OR: [
            {
              totalPoints: {
                gt: user.totalPoints,
              },
            },
            {
              AND: [
                {
                  totalPoints: user.totalPoints,
                },
                {
                  totalPointsReachedAt: {
                    lt: user.totalPointsReachedAt,
                  },
                },
              ],
            },
            {
              AND: [
                {
                  totalPoints: user.totalPoints,
                },
                {
                  totalPointsReachedAt: user.totalPointsReachedAt,
                },
                {
                  username: {
                    lt: user.username,
                  },
                },
              ],
            },
          ],
        },
      }),

      prisma.gameSession.findMany({
        where: {
          userId: user.id,
          status: "COMPLETED",
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          score: true,
          totalQuestions: true,
          correctAnswers: true,
          incorrectAnswers: true,
          questionsAnswered: true,
          completedAt: true,
          durationSeconds: true,
        },
      }),

      prisma.gameSession.findMany({
        where: {
          userId: user.id,
          status: "COMPLETED",
        },
        select: {
          correctAnswers: true,
          totalQuestions: true,
        },
      }),
    ]);

    const rank = usersAhead + 1;

    const accuracy =
      user.questionsAnswered > 0
        ? Math.round((user.correctAnswers / user.questionsAnswered) * 100)
        : 0;

    const hasPerfectRound = completedGames.some(
      (game) =>
        game.totalQuestions > 0 && game.correctAnswers === game.totalQuestions,
    );

    const longestStreak = Math.max(user.longestStreak, user.currentStreak);

    const achievements = [
      {
        type: "STREAK_1",
        label: "1-day streak",
        unlocked: longestStreak >= 1,
      },
      {
        type: "STREAK_7",
        label: "7-day streak",
        unlocked: longestStreak >= 7,
      },
      {
        type: "STREAK_14",
        label: "14-day streak",
        unlocked: longestStreak >= 14,
      },
      {
        type: "STREAK_30",
        label: "30-day streak",
        unlocked: longestStreak >= 30,
      },
      {
        type: "STREAK_60",
        label: "60-day streak",
        unlocked: longestStreak >= 60,
      },
      {
        type: "STREAK_90",
        label: "90-day streak",
        unlocked: longestStreak >= 90,
      },
      {
        type: "PERFECT_ROUND",
        label: "Perfect Round",
        unlocked: hasPerfectRound,
      },
      {
        type: "CORRECT_500",
        label: "500 correct answers",
        unlocked: user.correctAnswers >= 500,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        phone: user.phone,
        createdAt: user.createdAt,
        totalPoints: user.totalPoints,
        rank,
        gamesPlayed: user.gamesPlayed,
        questionsAnswered: user.questionsAnswered,
        correctAnswers: user.correctAnswers,
        accuracy,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastPlayedDate: user.lastPlayedDate,
        achievements,
        recentGames,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your profile.",
      },
      { status: 500 },
    );
  }
}
