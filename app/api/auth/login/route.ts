import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!rawPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter your phone number.",
        },
        { status: 400 },
      );
    }

    let phone: string;

    try {
      phone = normalizePhone(rawPhone);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid Nigerian phone number.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        username: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No TinkHubb account was found with this phone number. Please register first.",
        },
        { status: 404 },
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          message: "This account is currently suspended.",
        },
        { status: 403 },
      );
    }

    if (user.status === "DELETED") {
      return NextResponse.json(
        {
          success: false,
          message: "This account is no longer available.",
        },
        { status: 403 },
      );
    }

    // OTP verification is temporarily disabled for returning users.
    // Create the normal authenticated session immediately.
    await createUserSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      data: {
        phone,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
