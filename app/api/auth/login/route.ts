import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
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

    await prisma.otpCode.deleteMany({
      where: {
        phone,
        purpose: "LOGIN",
        verifiedAt: null,
      },
    });

    const otp = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(otp, 10);

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        phone,
        codeHash,
        purpose: "LOGIN",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[TINKHUBB DEV LOGIN OTP] ${phone} → ${otp}\n`);
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent.",
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
