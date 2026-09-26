import { createHash } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

const passwordSchema = z.object({
  password: z.string().min(8).max(100),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params;

  if (!token) {
    return NextResponse.json(
      { message: "Invalid invitation." },
      { status: 400 },
    );
  }

  const invite = await prisma.adminInvite.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    select: {
      name: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
    },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) {
    return NextResponse.json(
      { message: "This invitation is invalid or has expired." },
      { status: 410 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      name: invite.name,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  try {
    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? "Enter a valid password.",
        },
        { status: 400 },
      );
    }

    const invite = await prisma.adminInvite.findUnique({
      where: {
        tokenHash: hashToken(token),
      },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) {
      return NextResponse.json(
        { message: "This invitation is invalid or has expired." },
        { status: 410 },
      );
    }

    const existingAdmin = await prisma.adminUser.findUnique({
      where: {
        email: invite.email,
      },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: "An administrator with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const createdAdmin = await prisma.$transaction(async (tx) => {
      const created = await tx.adminUser.create({
        data: {
          name: invite.name,
          email: invite.email,
          passwordHash,
          role: invite.role,
          status: "ACTIVE",
        },
      });

      await tx.adminInvite.update({
        where: {
          id: invite.id,
        },
        data: {
          acceptedAt: new Date(),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId: created.id,
          action: "ACCEPT_ADMIN_INVITE",
          entity: "AdminUser",
          entityId: created.id,
          details: {
            email: created.email,
            role: created.role,
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully.",
      data: {
        id: createdAdmin.id,
      },
    });
  } catch (error) {
    console.error("Admin invite acceptance error:", error);

    return NextResponse.json(
      { message: "Unable to complete the invitation." },
      { status: 500 },
    );
  }
}
