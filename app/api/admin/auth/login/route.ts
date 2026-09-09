import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth/admin/session";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Enter a valid email and password.",
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();

    const admin = await prisma.adminUser.findUnique({
      where: {
        email,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    if (admin.status !== "ACTIVE") {
      return NextResponse.json(
        {
          message: "This admin account is currently blocked.",
        },
        { status: 403 },
      );
    }

    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      admin.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    await prisma.adminUser.update({
      where: {
        id: admin.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    await createAdminSession(admin.id);

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to sign in. Please try again.",
      },
      { status: 500 },
    );
  }
}
