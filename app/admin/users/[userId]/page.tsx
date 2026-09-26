import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/admin-shell";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import PlayerDetailClient from "./player-detail-client";

type PageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function PlayerDetailPage({ params }: PageProps) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const { userId } = await params;

  const player = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      phone: true,
      totalPoints: true,
      gamesPlayed: true,
      questionsAnswered: true,
      correctAnswers: true,
      currentStreak: true,
      longestStreak: true,
      status: true,
      createdAt: true,
      badges: {
        orderBy: {
          earnedAt: "desc",
        },
        select: {
          earnedAt: true,
          badge: {
            select: {
              type: true,
              name: true,
              description: true,
            },
          },
        },
      },
      games: {
        where: {
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
          completedAt: true,
          startedAt: true,
        },
      },
    },
  });

  if (!player) {
    notFound();
  }

  const rankedPlayers = await prisma.user.findMany({
    where: {
      status: {
        in: ["ACTIVE", "SUSPENDED"],
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
    },
  });

  const rankIndex = rankedPlayers.findIndex((item) => item.id === player.id);
  const rank = rankIndex === -1 ? null : rankIndex + 1;

  return (
    <AdminShell
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
      active="users"
    >
      <PlayerDetailClient
        player={{
          id: player.id,
          username: player.username,
          phone: player.phone,
          totalPoints: player.totalPoints,
          gamesPlayed: player.gamesPlayed,
          questionsAnswered: player.questionsAnswered,
          correctAnswers: player.correctAnswers,
          currentStreak: player.currentStreak,
          longestStreak: player.longestStreak,
          status: player.status,
          createdAt: player.createdAt.toISOString(),
          rank,
          badges: player.badges.map((item) => ({
            earnedAt: item.earnedAt.toISOString(),
            type: item.badge.type,
            name: item.badge.name,
            description: item.badge.description,
          })),
          recentSessions: player.games.map((game) => ({
            id: game.id,
            score: game.score,
            totalQuestions: game.totalQuestions,
            completedAt: game.completedAt?.toISOString() ?? null,
            startedAt: game.startedAt.toISOString(),
          })),
        }}
      />
    </AdminShell>
  );
}
