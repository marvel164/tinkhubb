import { prisma } from "@/lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getPreviousWeekRange() {
  const now = new Date();

  const currentDay = now.getUTCDay();
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  const currentWeekStart = new Date(now);
  currentWeekStart.setUTCHours(0, 0, 0, 0);
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - daysSinceMonday);

  const weekEnd = new Date(currentWeekStart);
  const weekStart = new Date(currentWeekStart);

  weekStart.setTime(weekStart.getTime() - WEEK_MS);
  weekEnd.setTime(weekEnd.getTime() - 1);

  return {
    weekStart,
    weekEnd,
  };
}

export async function generateWeeklyPerformanceSummary() {
  const { weekStart, weekEnd } = getPreviousWeekRange();

  const existingSummary = await prisma.adminWeeklySummary.findUnique({
    where: {
      weekStart,
    },
  });

  if (existingSummary) {
    return {
      created: false,
      reason: "ALREADY_GENERATED",
      summaryId: existingSummary.id,
    };
  }

  const [
    gamesPlayed,
    questionsAnswered,
    correctAnswers,
    totalPoints,
    newPlayers,
  ] = await Promise.all([
    prisma.gameSession.count({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    }),

    prisma.gameAnswer.count({
      where: {
        answeredAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    }),

    prisma.gameAnswer.count({
      where: {
        result: "CORRECT",
        answeredAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    }),

    prisma.gameAnswer.aggregate({
      _sum: {
        pointsEarned: true,
      },
      where: {
        answeredAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    }),

    prisma.user.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    }),
  ]);

  const accuracy =
    questionsAnswered > 0
      ? Math.round((correctAnswers / questionsAnswered) * 100)
      : 0;

  const pointsEarned = totalPoints._sum.pointsEarned ?? 0;

  const summary = await prisma.$transaction(async (tx) => {
    const createdSummary = await tx.adminWeeklySummary.create({
      data: {
        weekStart,
        weekEnd,
      },
    });

    const admins = await tx.adminUser.findMany({
      where: {
        status: "ACTIVE",
        notifyWeeklySummary: true,
      },
      select: {
        id: true,
      },
    });

    if (admins.length > 0) {
      await tx.adminNotification.createMany({
        data: admins.map((admin) => ({
          type: "SYSTEM",
          title: "Weekly performance summary",
          message:
            `${gamesPlayed} games played, ${questionsAnswered} questions answered, ` +
            `${correctAnswers} correct answers, ${pointsEarned} points earned, ` +
            `${accuracy}% accuracy, and ${newPlayers} new players joined Tinkhupp.`,
          adminId: admin.id,
        })),
      });
    }

    return createdSummary;
  });

  return {
    created: true,
    summaryId: summary.id,
    weekStart,
    weekEnd,
    metrics: {
      gamesPlayed,
      questionsAnswered,
      correctAnswers,
      pointsEarned,
      accuracy,
      newPlayers,
    },
  };
}
