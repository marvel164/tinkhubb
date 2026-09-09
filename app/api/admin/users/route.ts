import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const querySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  status: z
    .enum(["ALL", "ACTIVE", "SUSPENDED", "DELETED"])
    .optional()
    .default("ALL"),
  sort: z
    .enum([
      "AZ",
      "ZA",
      "JOINED_ASC",
      "JOINED_DESC",
      "POINTS_DESC",
      "STREAK_DESC",
    ])
    .optional()
    .default("AZ"),
});

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);

    const parsed = querySchema.safeParse({
      search: url.searchParams.get("search") ?? "",
      status: url.searchParams.get("status") ?? "ALL",
      sort: url.searchParams.get("sort") ?? "AZ",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid player filters." },
        { status: 400 },
      );
    }

    const { search, status, sort } = parsed.data;

    const where = {
      ...(status !== "ALL" ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                username: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    let orderBy:
      | { username: "asc" | "desc" }
      | { createdAt: "asc" | "desc" }
      | { totalPoints: "desc" }
      | { currentStreak: "desc" };

    switch (sort) {
      case "ZA":
        orderBy = { username: "desc" };
        break;

      case "JOINED_ASC":
        orderBy = { createdAt: "asc" };
        break;

      case "JOINED_DESC":
        orderBy = { createdAt: "desc" };
        break;

      case "POINTS_DESC":
        orderBy = { totalPoints: "desc" };
        break;

      case "STREAK_DESC":
        orderBy = { currentStreak: "desc" };
        break;

      case "AZ":
      default:
        orderBy = { username: "asc" };
        break;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy,
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
        lastPlayedDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const [totalUsers, activeUsers, suspendedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { status: "ACTIVE" },
      }),
      prisma.user.count({
        where: { status: "SUSPENDED" },
      }),
    ]);

    return NextResponse.json({
      users,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
      },
    });
  } catch (error) {
    console.error("Admin users GET error:", error);

    return NextResponse.json(
      { message: "Unable to load players." },
      { status: 500 },
    );
  }
}
