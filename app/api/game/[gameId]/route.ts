import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{
    gameId: string;
  }>;
};

const STREAK_TIMEZONE = "Africa/Lagos";

function getLagosDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STREAK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getLagosDayStart(date: Date) {
  const dateKey = getLagosDateKey(date);
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  /*
   * Africa/Lagos is UTC+1 and does not observe DST.
   * Therefore Lagos 00:00 corresponds to the previous
   * day at 23:00 UTC.
   */
  return new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0) -
      60 * 60 * 1000,
  );
}

function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const previous = new Date(
    Date.UTC(year, month - 1, day) -
      24 * 60 * 60 * 1000,
  );

  return previous.toISOString().slice(0, 10);
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to play.",
        },
        { status: 401 },
      );
    }

    const { gameId } = await params;

    const game = await prisma.gameSession.findFirst({
      where: {
        id: gameId,
        userId: user.id,
      },
      include: {
        questions: {
          orderBy: {
            questionNumber: "asc",
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          message: "Game not found.",
        },
        { status: 404 },
      );
    }

    const currentQuestion =
      game.questions.find(
        (question) => !question.answered,
      ) ?? null;

    if (!currentQuestion) {
      const freshUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          currentStreak: true,
          longestStreak: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          gameId: game.id,
          status: game.status,
          completed: game.status === "COMPLETED",

          totalQuestions: game.totalQuestions,
          currentQuestionNumber: game.totalQuestions,

          questionTimeSeconds:
            game.questionTimeSeconds,

          score: game.score,
          correctAnswers: game.correctAnswers,
          incorrectAnswers: game.incorrectAnswers,
          questionsAnswered: game.questionsAnswered,

          currentStreak:
            freshUser?.currentStreak ?? 0,
          longestStreak:
            freshUser?.longestStreak ?? 0,

          durationSeconds: game.durationSeconds,
          completedAt: game.completedAt,
        },
      });
    }

    let questionStartedAt = currentQuestion.startedAt;

    if (!questionStartedAt) {
      questionStartedAt = new Date();

      await prisma.gameQuestion.update({
        where: {
          id: currentQuestion.id,
        },
        data: {
          startedAt: questionStartedAt,
        },
      });
    }

    const expiresAt = new Date(
      questionStartedAt.getTime() +
        game.questionTimeSeconds * 1000,
    );

    return NextResponse.json({
      success: true,
      data: {
        gameId: game.id,
        status: game.status,
        completed: false,

        totalQuestions: game.totalQuestions,
        currentQuestionNumber:
          currentQuestion.questionNumber,

        questionTimeSeconds:
          game.questionTimeSeconds,
        questionStartedAt,
        expiresAt,

        score: game.score,
        correctAnswers: game.correctAnswers,
        incorrectAnswers: game.incorrectAnswers,
        questionsAnswered: game.questionsAnswered,

        question: {
          id: currentQuestion.id,
          questionNumber:
            currentQuestion.questionNumber,
          text: currentQuestion.questionText,

          options: [
            {
              key: "A",
              text: currentQuestion.optionA,
            },
            {
              key: "B",
              text: currentQuestion.optionB,
            },
            {
              key: "C",
              text: currentQuestion.optionC,
            },
            {
              key: "D",
              text: currentQuestion.optionD,
            },
          ],
        },
      },
    });
  } catch (error) {
    console.error("Game fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load the game.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to play.",
        },
        { status: 401 },
      );
    }

    const { gameId } = await params;

    const body = await request.json();

    const selectedOption =
      typeof body.selectedOption === "string"
        ? body.selectedOption.toUpperCase().trim()
        : "";

    const validOptions = ["A", "B", "C", "D"];

    if (
      selectedOption &&
      !validOptions.includes(selectedOption)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid answer option.",
        },
        { status: 400 },
      );
    }

    const game = await prisma.gameSession.findFirst({
      where: {
        id: gameId,
        userId: user.id,
        status: "IN_PROGRESS",
      },
      include: {
        questions: {
          orderBy: {
            questionNumber: "asc",
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          message: "Active game not found.",
        },
        { status: 404 },
      );
    }

    const currentQuestion = game.questions.find(
      (question) => !question.answered,
    );

    if (!currentQuestion) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This game has already been completed.",
        },
        { status: 409 },
      );
    }

    const startedAt =
      currentQuestion.startedAt ?? new Date();

    const now = new Date();

    const elapsedMs =
      now.getTime() - startedAt.getTime();

    const timeExpired =
      elapsedMs >=
      game.questionTimeSeconds * 1000;

    const timedOut =
      !selectedOption || timeExpired;

    const result = timedOut
      ? "TIMEOUT"
      : selectedOption ===
          currentQuestion.correctOption
        ? "CORRECT"
        : "INCORRECT";

    const pointsEarned =
      result === "CORRECT"
        ? currentQuestion.pointsAvailable
        : 0;

    const responseTimeMs = Math.max(
      0,
      Math.min(
        elapsedMs,
        game.questionTimeSeconds * 1000,
      ),
    );

    const nextQuestion = game.questions.find(
      (question) =>
        question.questionNumber ===
        currentQuestion.questionNumber + 1,
    );

    const isLastQuestion = !nextQuestion;

    const transactionResult =
      await prisma.$transaction(async (tx) => {
        const claimedQuestion =
          await tx.gameQuestion.updateMany({
            where: {
              id: currentQuestion.id,
              answered: false,
            },
            data: {
              answered: true,
              answeredAt: now,
            },
          });

        if (claimedQuestion.count !== 1) {
          throw new Error(
            "QUESTION_ALREADY_ANSWERED",
          );
        }

        await tx.gameAnswer.create({
          data: {
            userId: user.id,
            gameQuestionId: currentQuestion.id,
            selectedOption:
              selectedOption || null,
            result,
            pointsEarned,
            responseTimeMs,
            answeredAt: now,
          },
        });

        const updatedGame =
          await tx.gameSession.update({
            where: {
              id: game.id,
            },
            data: {
              score: {
                increment: pointsEarned,
              },

              correctAnswers:
                result === "CORRECT"
                  ? { increment: 1 }
                  : undefined,

              incorrectAnswers:
                result !== "CORRECT"
                  ? { increment: 1 }
                  : undefined,

              questionsAnswered: {
                increment: 1,
              },

              ...(isLastQuestion
                ? {
                    status: "COMPLETED",
                    completedAt: now,

                    durationSeconds: Math.round(
                      (now.getTime() -
                        game.startedAt.getTime()) /
                        1000,
                    ),

                    scoreReachedAt:
                      pointsEarned > 0
                        ? now
                        : game.scoreReachedAt,
                  }
                : {}),
            },
          });

        /*
         * Read the latest player state inside the transaction.
         * This prevents the streak calculation from relying
         * on stale session data.
         */
        const player = await tx.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            currentStreak: true,
            longestStreak: true,
            lastPlayedDate: true,
          },
        });

        if (!player) {
          throw new Error("USER_NOT_FOUND");
        }

        let currentStreak =
          player.currentStreak;

        let longestStreak =
          player.longestStreak;

        /*
         * Streaks are updated exactly once when a game
         * is completed for a Lagos calendar day.
         */
        if (isLastQuestion) {
          const todayKey =
            getLagosDateKey(now);

          const todayStart =
            getLagosDayStart(now);

          /*
           * createMany + skipDuplicates makes the
           * daily streak update idempotent.
           *
           * If the user completes another game today,
           * the existing unique StreakRecord prevents
           * the streak from increasing again.
           */
          const streakRecord =
            await tx.streakRecord.createMany({
              data: {
                userId: user.id,
                streakDate: todayStart,
                streakValue: 0,
                completedGame: true,
              },
              skipDuplicates: true,
            });

          if (streakRecord.count === 1) {
            const yesterdayKey =
              getPreviousDateKey(todayKey);

            const lastPlayedKey =
              player.lastPlayedDate
                ? getLagosDateKey(
                    player.lastPlayedDate,
                  )
                : null;

            if (
              lastPlayedKey ===
              yesterdayKey
            ) {
              currentStreak =
                player.currentStreak + 1;
            } else if (
              lastPlayedKey === todayKey
            ) {
              currentStreak =
                player.currentStreak;
            } else {
              currentStreak = 1;
            }

            longestStreak = Math.max(
              player.longestStreak,
              currentStreak,
            );

            await tx.streakRecord.update({
              where: {
                userId_streakDate: {
                  userId: user.id,
                  streakDate: todayStart,
                },
              },
              data: {
                streakValue: currentStreak,
                completedGame: true,
              },
            });
          }
        }

        const updatedUser =
          await tx.user.update({
            where: {
              id: user.id,
            },
            data: {
              totalPoints: {
                increment: pointsEarned,
              },

              questionsAnswered: {
                increment: 1,
              },

              correctAnswers:
                result === "CORRECT"
                  ? { increment: 1 }
                  : undefined,

              ...(isLastQuestion
                ? {
                    gamesPlayed: {
                      increment: 1,
                    },

                    ...(currentStreak !==
                      player.currentStreak ||
                    longestStreak !==
                      player.longestStreak
                      ? {
                          currentStreak,
                          longestStreak,
                          lastPlayedDate:
                            getLagosDayStart(now),
                        }
                      : {}),
                  }
                : {}),

              ...(pointsEarned > 0
                ? {
                    totalPointsReachedAt:
                      now,
                  }
                : {}),
            },
            select: {
              currentStreak: true,
              longestStreak: true,
              lastPlayedDate: true,
            },
          });

        if (nextQuestion) {
          await tx.gameQuestion.update({
            where: {
              id: nextQuestion.id,
            },
            data: {
              startedAt: now,
            },
          });
        }

        return {
          game: updatedGame,
          user: updatedUser,
          streakUpdated:
            isLastQuestion &&
            updatedUser.lastPlayedDate !== null,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        result,
        pointsEarned,

        completed: isLastQuestion,

        gameId: transactionResult.game.id,

        score: transactionResult.game.score,
        correctAnswers:
          transactionResult.game.correctAnswers,
        incorrectAnswers:
          transactionResult.game.incorrectAnswers,
        questionsAnswered:
          transactionResult.game.questionsAnswered,

        currentStreak:
          transactionResult.user.currentStreak,
        longestStreak:
          transactionResult.user.longestStreak,

        streakUpdated:
          transactionResult.streakUpdated,

        nextQuestionNumber:
          nextQuestion?.questionNumber ?? null,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "QUESTION_ALREADY_ANSWERED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This question has already been answered.",
        },
        { status: 409 },
      );
    }

    console.error(
      "Game answer error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to submit your answer.",
      },
      { status: 500 },
    );
  }
}
