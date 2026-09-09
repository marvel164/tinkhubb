import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const paramsSchema = z.object({
  userId: z.string().min(1),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

    const params = await context.params;

    const parsed = paramsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid player ID." },
        { status: 400 },
      );
    }

    const { userId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phone: true,
        status: true,
        totalPoints: true,
        gamesPlayed: true,
        questionsAnswered: true,
        correctAnswers: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Player not found." },
        { status: 404 },
      );
    }

    const games = await prisma.gameSession.findMany({
      where: {
        userId,
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        totalQuestions: true,
        totalTimeSeconds: true,
        questionTimeSeconds: true,
        score: true,
        correctAnswers: true,
        incorrectAnswers: true,
        questionsAnswered: true,
        startedAt: true,
        completedAt: true,
        durationSeconds: true,
      },
    });

    const history = games.map((game) => {
      const accuracy =
        game.questionsAnswered > 0
          ? Math.round(
              (game.correctAnswers / game.questionsAnswered) * 100,
            )
          : 0;

      return {
        ...game,
        accuracy,
      };
    });

    return NextResponse.json({
      user,
      history,
    });
  } catch (error) {
    console.error("Admin player history GET error:", error);

    return NextResponse.json(
      { message: "Unable to load player history." },
      { status: 500 },
    );
  }
}
