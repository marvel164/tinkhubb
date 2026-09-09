import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const TOTAL_QUESTIONS = 10;

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to start a game.",
        },
        { status: 401 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not currently allowed to play.",
        },
        { status: 403 },
      );
    }

    const settings = await prisma.gameSettings.findFirst();

    const totalTimeSeconds = settings?.totalTimeSeconds ?? 600;

    // TinkHubb uses one total session timer divided equally
    // across the 10 questions.
    const questionTimeSeconds = Math.floor(
      totalTimeSeconds / TOTAL_QUESTIONS,
    );

    if (questionTimeSeconds < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Game timer configuration is invalid.",
        },
        { status: 500 },
      );
    }

    /*
     * A fresh Play action should always start from Question 1.
     *
     * Any unfinished previous session is abandoned instead of
     * silently resumed. This is what prevents a user returning
     * to Question 3, Question 4, etc.
     */
    await prisma.gameSession.updateMany({
      where: {
        userId: user.id,
        status: "IN_PROGRESS",
      },
      data: {
        status: "ABANDONED",
      },
    });

    const activeQuestions = await prisma.question.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        question: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        correctOption: true,
        points: true,
      },
    });

    if (activeQuestions.length < TOTAL_QUESTIONS) {
      return NextResponse.json(
        {
          success: false,
          message:
            "There are not enough active questions available to start a game.",
        },
        { status: 409 },
      );
    }

    // Fisher-Yates shuffle.
    for (let i = activeQuestions.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));

      [activeQuestions[i], activeQuestions[j]] = [
        activeQuestions[j],
        activeQuestions[i],
      ];
    }

    const selectedQuestions = activeQuestions.slice(
      0,
      TOTAL_QUESTIONS,
    );

    const startedAt = new Date();

    const game = await prisma.gameSession.create({
      data: {
        userId: user.id,
        status: "IN_PROGRESS",

        totalQuestions: TOTAL_QUESTIONS,
        totalTimeSeconds,
        questionTimeSeconds,

        startedAt,

        questions: {
          create: selectedQuestions.map((question, index) => ({
            questionId: question.id,
            questionNumber: index + 1,

            questionText: question.question,

            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,

            correctOption: question.correctOption,
            pointsAvailable: question.points,

            // Only Question 1 starts immediately.
            startedAt: index === 0 ? startedAt : null,
          })),
        },
      },

      select: {
        id: true,
        totalQuestions: true,
        totalTimeSeconds: true,
        questionTimeSeconds: true,
        startedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Game started successfully.",
      data: {
        gameId: game.id,
        totalQuestions: game.totalQuestions,
        totalTimeSeconds: game.totalTimeSeconds,
        questionTimeSeconds: game.questionTimeSeconds,
        startedAt: game.startedAt,
      },
    });
  } catch (error) {
    console.error("Game start error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to start the game. Please try again.",
      },
      { status: 500 },
    );
  }
}
