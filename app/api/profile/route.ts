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

    const [usersAhead, recentGames] = await Promise.all([
      prisma.user.count({
        where: {
          status: "ACTIVE",
          totalPoints: {
            gt: user.totalPoints,
          },
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
        take: 5,
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
    ]);

    const rank = usersAhead + 1;

    const accuracy =
      user.questionsAnswered > 0
        ? Math.round(
            (user.correctAnswers / user.questionsAnswered) * 100,
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        username: user.username,
        phone: user.phone,
        totalPoints: user.totalPoints,
        rank,
        gamesPlayed: user.gamesPlayed,
        questionsAnswered: user.questionsAnswered,
        correctAnswers: user.correctAnswers,
        accuracy,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastPlayedDate: user.lastPlayedDate,
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
