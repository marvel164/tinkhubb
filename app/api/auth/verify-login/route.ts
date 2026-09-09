import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";

    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!rawPhone || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter the 6-digit verification code.",
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
          message: "Invalid phone number.",
        },
        { status: 400 },
      );
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        purpose: "LOGIN",
        verifiedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "No active verification code was found.",
        },
        { status: 400 },
      );
    }

    if (otpRecord.expiresAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "This verification code has expired.",
        },
        { status: 400 },
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many incorrect attempts. Please request a new code.",
        },
        { status: 429 },
      );
    }

    const validCode = await bcrypt.compare(code, otpRecord.codeHash);

    if (!validCode) {
      await prisma.otpCode.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Incorrect verification code.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        phone,
      },
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
          message: "Account not found.",
        },
        { status: 404 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            user.status === "SUSPENDED"
              ? "This account is currently suspended."
              : "This account is no longer available.",
        },
        { status: 403 },
      );
    }

    await prisma.otpCode.update({
      where: {
        id: otpRecord.id,
      },
      data: {
        verifiedAt: new Date(),
      },
    });

    await createUserSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      data: {
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login OTP verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
