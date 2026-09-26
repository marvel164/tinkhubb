import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import { createAdminNotification } from "@/lib/notifications/admin";

type RouteContext = {
  params: Promise<{
    adminId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        message: "Only a Super Admin can manage administrators.",
      },
      { status: 403 },
    );
  }

  const { adminId } = await context.params;

  if (adminId === admin.id) {
    return NextResponse.json(
      {
        message: "You cannot change your own admin status.",
      },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const action = body?.action;

    if (!["block", "unblock"].includes(action)) {
      return NextResponse.json(
        { message: "Invalid admin action." },
        { status: 400 },
      );
    }

    const target = await prisma.adminUser.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!target) {
      return NextResponse.json(
        { message: "Administrator not found." },
        { status: 404 },
      );
    }

    if (action === "block") {
      if (target.status === "BLOCKED") {
        return NextResponse.json(
          {
            message: "This administrator is already blocked.",
          },
          { status: 400 },
        );
      }

      if (target.role === "SUPER_ADMIN") {
        const activeSuperAdmins = await prisma.adminUser.count({
          where: {
            role: "SUPER_ADMIN",
            status: "ACTIVE",
          },
        });

        if (activeSuperAdmins <= 1) {
          return NextResponse.json(
            {
              message: "The last active Super Admin cannot be blocked.",
            },
            { status: 400 },
          );
        }
      }

      await prisma.$transaction([
        prisma.adminUser.update({
          where: {
            id: adminId,
          },
          data: {
            status: "BLOCKED",
          },
        }),

        prisma.adminSession.deleteMany({
          where: {
            adminId,
          },
        }),

        prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            action: "BLOCK_ADMIN",
            entity: "AdminUser",
            entityId: adminId,
            details: {
              targetEmail: target.email,
            },
          },
        }),
      ]);

      try {
        await createAdminNotification({
          type: "ADMIN_TEAM_ACTIVITY",
          title: "Admin blocked",
          message: `${target.name} has been blocked from the admin console.`,
          adminId: admin.id,
        });
      } catch (notificationError) {
        console.error("Admin block notification error:", notificationError);
      }

      return NextResponse.json({
        success: true,
        message: "Administrator blocked successfully.",
      });
    }

    if (target.status === "ACTIVE") {
      return NextResponse.json(
        {
          message: "This administrator is already active.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.adminUser.update({
        where: {
          id: adminId,
        },
        data: {
          status: "ACTIVE",
        },
      }),

      prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "UNBLOCK_ADMIN",
          entity: "AdminUser",
          entityId: adminId,
          details: {
            targetEmail: target.email,
          },
        },
      }),
    ]);

    try {
      await createAdminNotification({
        type: "ADMIN_TEAM_ACTIVITY",
        title: "Admin reactivated",
        message: `${target.name} has been reactivated on the admin team.`,
        adminId: admin.id,
      });
    } catch (notificationError) {
      console.error("Admin unblock notification error:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Administrator unblocked successfully.",
    });
  } catch (error) {
    console.error("Admin team status error:", error);

    return NextResponse.json(
      {
        message: "Unable to update the administrator.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      {
        message: "Only a Super Admin can delete administrators.",
      },
      { status: 403 },
    );
  }

  const { adminId } = await context.params;

  if (adminId === admin.id) {
    return NextResponse.json(
      {
        message: "You cannot delete your own administrator account.",
      },
      { status: 400 },
    );
  }

  try {
    const target = await prisma.adminUser.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!target) {
      return NextResponse.json(
        {
          message: "Administrator not found.",
        },
        { status: 404 },
      );
    }

    if (target.role === "SUPER_ADMIN") {
      const activeSuperAdmins = await prisma.adminUser.count({
        where: {
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });

      if (target.status === "ACTIVE" && activeSuperAdmins <= 1) {
        return NextResponse.json(
          {
            message: "The last active Super Admin cannot be deleted.",
          },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction([
      prisma.adminUser.delete({
        where: {
          id: adminId,
        },
      }),

      prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "DELETE_ADMIN",
          entity: "AdminUser",
          entityId: adminId,
          details: {
            targetEmail: target.email,
            targetName: target.name,
            targetRole: target.role,
          },
        },
      }),
    ]);

    try {
      await createAdminNotification({
        type: "ADMIN_TEAM_ACTIVITY",
        title: "Admin removed",
        message: `${target.name} has been removed from the admin team.`,
        adminId: admin.id,
      });
    } catch (notificationError) {
      console.error("Admin delete notification error:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Administrator deleted successfully.",
    });
  } catch (error) {
    console.error("Admin team delete error:", error);

    return NextResponse.json(
      {
        message: "Unable to delete the administrator.",
      },
      { status: 500 },
    );
  }
}
