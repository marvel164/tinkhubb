import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import { sendAdminInvitationEmail } from "@/lib/email/admin-invitation";
import { createAdminNotification } from "@/lib/notifications/admin";

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

export async function GET() {
  try {
    const currentAdmin = await getCurrentAdmin();

    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [admins, invites] = await Promise.all([
      prisma.adminUser.findMany({
        orderBy: [{ name: "asc" }, { email: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),

      prisma.adminInvite.findMany({
        where: {
          acceptedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: [{ name: "asc" }, { email: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);

    const adminRows = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      source: "ADMIN" as const,
    }));

    const inviteRows = invites.map((invite) => ({
      id: invite.id,
      name: invite.name,
      email: invite.email,
      role: invite.role,
      status: "INVITED" as const,
      lastLoginAt: null,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      source: "INVITE" as const,
    }));

    const rows = [...adminRows, ...inviteRows].sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);

      if (nameCompare !== 0) {
        return nameCompare;
      }

      return a.email.localeCompare(b.email);
    });

    return NextResponse.json({
      data: {
        currentAdminId: currentAdmin.id,
        currentAdminRole: currentAdmin.role,
        admins: rows,
        stats: {
          total: admins.length,
          active: admins.filter((admin) => admin.status === "ACTIVE").length,
          blocked: admins.filter((admin) => admin.status === "BLOCKED").length,
          invited: invites.length,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/team error:", error);

    return NextResponse.json(
      { error: "Failed to load admin team" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentAdmin = await getCurrentAdmin();

    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentAdmin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Only Super Admins can invite administrators",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid request",
        },
        { status: 400 },
      );
    }

    const { name, email, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingAdmin = await prisma.adminUser.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          error: "An administrator with this email already exists",
        },
        { status: 409 },
      );
    }

    const existingInvite = await prisma.adminInvite.findFirst({
      where: {
        email: normalizedEmail,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        {
          error: "A pending invitation already exists for this email",
        },
        { status: 409 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invite = await prisma.adminInvite.create({
      data: {
        name,
        email: normalizedEmail,
        role,
        tokenHash,
        expiresAt,
        invitedById: currentAdmin.id,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      await prisma.adminInvite.delete({
        where: {
          id: invite.id,
        },
      });

      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_APP_URL is not configured",
        },
        { status: 500 },
      );
    }

    const inviteUrl = `${appUrl.replace(/\/$/, "")}/admin/invite/${token}`;

    try {
      await sendAdminInvitationEmail({
        name,
        email: normalizedEmail,
        inviteUrl,
        expiresAt,
      });
    } catch (emailError) {
      console.error("Admin invitation email failed:", emailError);

      await prisma.adminInvite.delete({
        where: {
          id: invite.id,
        },
      });

      return NextResponse.json(
        {
          error:
            "The invitation could not be sent. The invitation was not created.",
        },
        { status: 502 },
      );
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: currentAdmin.id,
        action: "INVITE_ADMIN",
        entity: "AdminUser",
        entityId: invite.id,
        details: {
          invitedName: name,
          invitedEmail: normalizedEmail,
          invitedRole: role,
        },
      },
    });

    /*
     * The invitation has now been successfully created,
     * emailed, and audited. Notification failure must
     * never cause the successful invitation to fail.
     */
    try {
      await createAdminNotification({
        type: "ADMIN_TEAM_ACTIVITY",
        title: "Admin invited",
        message: `${name} has been invited to join the admin team.`,
        adminId: currentAdmin.id,
      });
    } catch (notificationError) {
      console.error("Admin invite notification error:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin invitation sent successfully",
        expiresAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/team error:", error);

    return NextResponse.json(
      {
        error: "Failed to send admin invitation",
      },
      { status: 500 },
    );
  }
}
