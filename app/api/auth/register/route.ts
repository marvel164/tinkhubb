import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import { createAdminNotification } from "@/lib/notifications/admin";
import {
  normalizePhone,
  registrationSchema,
} from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error.issues[0]?.message ?? "Invalid input",
        },
        { status: 400 },
      );
    }

    const username = result.data.username.trim();
    const phone = normalizePhone(result.data.phone);

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "That username is already taken",
        },
        { status: 409 },
      );
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            existingPhone.status === "SUSPENDED"
              ? "This account is currently suspended."
              : "An account already exists with this phone number.",
        },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        username,
        phone,
        status: "ACTIVE",
      },
      select: {
        id: true,
        username: true,
        phone: true,
      },
    });

    await createAdminNotification({
      type: "NEW_USER",
      title: "New player registered",
      message: `${user.username} just joined Tinkhupp.`,
      userId: user.id,
    });

    await createUserSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      data: {
        username: user.username,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}