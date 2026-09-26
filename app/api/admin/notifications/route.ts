import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

export async function GET() {
  try {
    const currentAdmin = await getCurrentAdmin();

    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        where: {
          adminId: currentAdmin.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          readAt: true,
          userId: true,
          adminId: true,
        },
      }),
      prisma.adminNotification.count({
        where: {
          adminId: currentAdmin.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);

    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentAdmin = await getCurrentAdmin();

    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body.all === true) {
      await prisma.adminNotification.updateMany({
        where: {
          adminId: currentAdmin.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (typeof body.id !== "string" || !body.id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 },
      );
    }

    const notification = await prisma.adminNotification.findFirst({
      where: {
        id: body.id,
        adminId: currentAdmin.id,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    await prisma.adminNotification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/notifications error:", error);

    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
