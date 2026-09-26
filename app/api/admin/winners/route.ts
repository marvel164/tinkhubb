import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const DEFAULT_LEADERBOARD_SLOTS = 30;
const DEFAULT_RAFFLE_SLOTS = 10;
const DEFAULT_REQUIRED_STREAK = 30;
const TIME_ZONE = "Africa/Lagos";

function getLagosParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value) - 1,
  };
}

function getLagosMonthRange(date = new Date()) {
  const { year, month } = getLagosParts(date);

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  // Lagos is UTC+1 with no DST.
  const startsAt = new Date(Date.UTC(year, month, 1, -1, 0, 0));
  const endsAt = new Date(Date.UTC(nextYear, nextMonth, 1, -1, 0, 0) - 1);

  return {
    year,
    month,
    startsAt,
    endsAt,
  };
}

function formatMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(Date.UTC(year, month, 1, 12)));
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

async function getOrCreateCampaign() {
  const { year, month, startsAt, endsAt } = getLagosMonthRange();

  const name = `Monthly Winners — ${formatMonth(year, month)}`;

  const existing = await prisma.campaign.findFirst({
    where: {
      startsAt,
      endsAt,
    },
    include: {
      winners: {
        orderBy: {
          selectedAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              totalPoints: true,
              currentStreak: true,
            },
          },
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.campaign.create({
    data: {
      name,
      description:
        "Monthly Tinkhupp winner selection: top leaderboard participants plus a fair 30-day streak raffle.",
      status: "DRAFT",
      startsAt,
      endsAt,
      leaderboardSlots: DEFAULT_LEADERBOARD_SLOTS,
      raffleSlots: DEFAULT_RAFFLE_SLOTS,
      requiredStreak: DEFAULT_REQUIRED_STREAK,
    },
    include: {
      winners: {
        orderBy: {
          selectedAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              totalPoints: true,
              currentStreak: true,
            },
          },
        },
      },
    },
  });
}

async function buildSelection(
  campaign: Awaited<ReturnType<typeof getOrCreateCampaign>>,
) {
  const leaderboard = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
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
    take: campaign.leaderboardSlots,
    select: {
      id: true,
      username: true,
      totalPoints: true,
      currentStreak: true,
    },
  });

  const topIds = new Set(leaderboard.map((user) => user.id));

  const eligibleUsers = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      currentStreak: {
        gte: campaign.requiredStreak,
      },
      id: {
        notIn: [...topIds],
      },
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
    select: {
      id: true,
      username: true,
      totalPoints: true,
      currentStreak: true,
    },
  });

  return {
    leaderboard,
    eligibleUsers,
  };
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const campaign = await getOrCreateCampaign();

    const { leaderboard, eligibleUsers } = await buildSelection(campaign);

    const existingRaffleWinners = campaign.winners
      .filter((winner) => winner.selectionType === "RAFFLE")
      .map((winner) => winner.user);

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          month: campaign.name.replace("Monthly Winners — ", ""),
          leaderboardSlots: campaign.leaderboardSlots,
          raffleSlots: campaign.raffleSlots,
          requiredStreak: campaign.requiredStreak,
          raffleDrawn: existingRaffleWinners.length > 0,
        },

        top30: leaderboard.map((user, index) => ({
          rank: index + 1,
          ...user,
        })),

        rafflePool: existingRaffleWinners.length
          ? existingRaffleWinners.map((user) => ({
              ...user,
              selected: true,
            }))
          : eligibleUsers.map((user) => ({
              ...user,
              selected: false,
            })),

        eligibleCount: eligibleUsers.length,
        raffleWinnerCount: existingRaffleWinners.length,
      },
    });
  } catch (error) {
    console.error("Winner selection GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load winner selection.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const campaign = await getOrCreateCampaign();

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.winnerSelection.findMany({
        where: {
          campaignId: campaign.id,
          selectionType: "RAFFLE",
        },
        select: {
          userId: true,
        },
      });

      if (existing.length > 0) {
        return {
          alreadyDrawn: true,
          winnerIds: existing.map((winner) => winner.userId),
        };
      }

      const leaderboard = await tx.user.findMany({
        where: {
          status: "ACTIVE",
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
        take: campaign.leaderboardSlots,
        select: {
          id: true,
          username: true,
          totalPoints: true,
          currentStreak: true,
        },
      });

      const topIds = new Set(leaderboard.map((user) => user.id));

      const eligibleUsers = await tx.user.findMany({
        where: {
          status: "ACTIVE",
          currentStreak: {
            gte: campaign.requiredStreak,
          },
          id: {
            notIn: [...topIds],
          },
        },
        select: {
          id: true,
          currentStreak: true,
        },
      });

      const shuffledUsers = shuffle(eligibleUsers);

      const selectedRaffleUsers = shuffledUsers.slice(
        0,
        Math.min(campaign.raffleSlots, shuffledUsers.length),
      );

      if (leaderboard.length > 0) {
        await tx.winnerSelection.createMany({
          data: leaderboard.map((user, index) => ({
            campaignId: campaign.id,
            userId: user.id,
            selectionType: "LEADERBOARD",
            rankPosition: index + 1,
          })),
          skipDuplicates: true,
        });
      }

      if (eligibleUsers.length > 0) {
        await tx.raffleEntry.createMany({
          data: eligibleUsers.map((user) => ({
            campaignId: campaign.id,
            userId: user.id,
            eligible: true,
            eligibleStreak: user.currentStreak,
          })),
          skipDuplicates: true,
        });
      }

      if (selectedRaffleUsers.length > 0) {
        await tx.winnerSelection.createMany({
          data: selectedRaffleUsers.map((user) => ({
            campaignId: campaign.id,
            userId: user.id,
            selectionType: "RAFFLE",
            rankPosition: null,
          })),
        });
      }

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "RUN_WINNER_SELECTION",
          entity: "Campaign",
          entityId: campaign.id,
          details: {
            leaderboardWinners: leaderboard.length,
            raffleEligible: eligibleUsers.length,
            raffleWinners: selectedRaffleUsers.length,
          },
        },
      });

      return {
        alreadyDrawn: false,
        winnerIds: selectedRaffleUsers.map((user) => user.id),
      };
    });

    if (result.alreadyDrawn) {
      return NextResponse.json({
        success: true,
        alreadyDrawn: true,
        message: "The raffle has already been drawn for this campaign.",
        winnerIds: result.winnerIds,
      });
    }

    return NextResponse.json({
      success: true,
      alreadyDrawn: false,
      message:
        result.winnerIds.length > 0
          ? `${result.winnerIds.length} raffle winner${
              result.winnerIds.length === 1 ? "" : "s"
            } selected.`
          : "No eligible raffle participants were available.",
      winnerIds: result.winnerIds,
    });
  } catch (error) {
    console.error("Winner selection POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to run the raffle draw.",
      },
      {
        status: 500,
      },
    );
  }
}
