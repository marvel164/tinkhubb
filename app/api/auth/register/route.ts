import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone, registrationSchema } from "@/lib/validation/auth";

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

    // Remove previous unused registration OTPs for this phone.
    await prisma.otpCode.deleteMany({
      where: {
        phone,
        purpose: "REGISTRATION",
        verifiedAt: null,
      },
    });

    const otp = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(otp, 10);

    await prisma.otpCode.create({
      data: {
        phone,
        pendingUsername: username,
        codeHash,
        purpose: "REGISTRATION",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    /*
     * Development delivery.
     *
     * We deliberately do not expose the OTP in the browser response.
     * Until the SMS provider credentials are configured, the OTP is
     * printed to the server terminal so the complete authentication
     * flow can be tested locally.
     */
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[TINKHUBB DEV OTP] ${phone} → ${otp}\n`);
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent.",
      data: {
        phone,
        username,
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
