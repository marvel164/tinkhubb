import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const bodySchema = z.object({
  action: z.enum(["SUSPEND", "UNSUSPEND", "DELETE"]),
  userIds: z.array(z.string().min(1)).min(1).max(500),
});

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid bulk player action." },
        { status: 400 },
      );
    }

    const { action, userIds } = parsed.data;

    const uniqueUserIds = [...new Set(userIds)];

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueUserIds,
        },
      },
      select: {
        id: true,
        username: true,
        status: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { message: "No matching players found." },
        { status: 404 },
      );
    }

    const newStatus =
      action === "SUSPEND"
        ? "SUSPENDED"
        : action === "UNSUSPEND"
          ? "ACTIVE"
          : "DELETED";

    const eligibleUsers = users.filter((user) => {
      if (action === "SUSPEND") {
        return user.status !== "DELETED" && user.status !== "SUSPENDED";
      }

      if (action === "UNSUSPEND") {
        return user.status === "SUSPENDED";
      }

      return user.status !== "DELETED";
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json(
        { message: "No selected players can receive this action." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: {
          id: {
            in: eligibleUsers.map((user) => user.id),
          },
        },
        data: {
          status: newStatus,
        },
      });

      await tx.adminAuditLog.createMany({
        data: eligibleUsers.map((user) => ({
          adminId: admin.id,
          action,
          entity: "USER",
          entityId: user.id,
          details: {
            username: user.username,
            previousStatus: user.status,
            newStatus,
          },
        })),
      });
    });

    return NextResponse.json({
      message: `${eligibleUsers.length} player${
        eligibleUsers.length === 1 ? "" : "s"
      } updated successfully.`,
      updatedCount: eligibleUsers.length,
    });
  } catch (error) {
    console.error("Admin users bulk POST error:", error);

    return NextResponse.json(
      { message: "Unable to complete bulk player action." },
      { status: 500 },
    );
  }
}
