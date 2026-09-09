import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim().replace(/[\s-]/g, "")
        : "";

    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!phone || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter the 6-digit verification code.",
        },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.startsWith("0")
      ? `+234${phone.slice(1)}`
      : phone;

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        purpose: "REGISTRATION",
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

    const username = otpRecord.pendingUsername;

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration information is incomplete.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { phone: normalizedPhone }],
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with these details already exists.",
        },
        { status: 409 },
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username,
          phone: normalizedPhone,
          status: "ACTIVE",
        },
      });

      await tx.otpCode.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          userId: createdUser.id,
          verifiedAt: new Date(),
        },
      });

      return createdUser;
    });

    await createUserSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Account verified successfully.",
      data: {
        username: user.username,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
