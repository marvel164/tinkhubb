import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const paramsSchema = z.object({
  userId: z.string().min(1),
});

const bodySchema = z.object({
  action: z.enum(["SUSPEND", "UNSUSPEND", "DELETE"]),
});

export async function PATCH(
  request: Request,
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
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        { message: "Invalid player ID." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsedBody = bodySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid player action." },
        { status: 400 },
      );
    }

    const { userId } = parsedParams.data;
    const { action } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Player not found." },
        { status: 404 },
      );
    }

    if (action === "SUSPEND" && user.status === "DELETED") {
      return NextResponse.json(
        { message: "Deleted players cannot be suspended." },
        { status: 400 },
      );
    }

    if (action === "UNSUSPEND" && user.status !== "SUSPENDED") {
      return NextResponse.json(
        { message: "Only suspended players can be reactivated." },
        { status: 400 },
      );
    }

    if (action === "DELETE" && user.status === "DELETED") {
      return NextResponse.json(
        { message: "Player is already deleted." },
        { status: 400 },
      );
    }

    const newStatus =
      action === "SUSPEND"
        ? "SUSPENDED"
        : action === "UNSUSPEND"
          ? "ACTIVE"
          : "DELETED";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: newStatus,
      },
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

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action,
        entity: "USER",
        entityId: user.id,
        details: {
          username: user.username,
          previousStatus: user.status,
          newStatus,
        },
      },
    });

    return NextResponse.json({
      message:
        action === "SUSPEND"
          ? "Player suspended successfully."
          : action === "UNSUSPEND"
            ? "Player reactivated successfully."
            : "Player deleted successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin user PATCH error:", error);

    return NextResponse.json(
      { message: "Unable to update player." },
      { status: 500 },
    );
  }
}
