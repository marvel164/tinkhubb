import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().max(30).optional(),
});

const gameSettingsSchema = z.object({
  questionsPerSession: z.number().int().min(1).max(100),
  totalTimeSeconds: z.number().int().min(10).max(86400),
  pointsPerCorrectAnswer: z.number().int().min(0).max(100),
  randomizeQuestions: z.boolean(),
});

const notificationSchema = z.object({
  notifySuspiciousActivity: z.boolean(),
  notifyWeeklySummary: z.boolean(),
  notifyStreakMilestones: z.boolean(),
  notifyAdminActivity: z.boolean(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const [adminData, gameSettings, sessions] = await Promise.all([
      prisma.adminUser.findUnique({
        where: {
          id: admin.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          twoFactorEnabled: true,
          notifySuspiciousActivity: true,
          notifyWeeklySummary: true,
          notifyStreakMilestones: true,
          notifyAdminActivity: true,
        },
      }),

      prisma.gameSettings.findFirst(),

      prisma.adminSession.findMany({
        where: {
          adminId: admin.id,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          lastUsedAt: "desc",
        },
        select: {
          id: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
        },
      }),
    ]);

    if (!adminData) {
      return NextResponse.json(
        { message: "Admin account not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          name: adminData.name,
          email: adminData.email,
          phoneNumber: adminData.phoneNumber ?? "",
          role: adminData.role,
        },

        gameDefaults: {
          questionsPerSession: gameSettings?.questionsPerSession ?? 10,
          totalTimeSeconds: gameSettings?.totalTimeSeconds ?? 600,
          pointsPerCorrectAnswer: gameSettings?.pointsPerCorrectAnswer ?? 1,
          randomizeQuestions: gameSettings?.randomizeQuestions ?? true,
        },

        notifications: {
          notifySuspiciousActivity: adminData.notifySuspiciousActivity,
          notifyWeeklySummary: adminData.notifyWeeklySummary,
          notifyStreakMilestones: adminData.notifyStreakMilestones,
          notifyAdminActivity: adminData.notifyAdminActivity,
        },

        security: {
          twoFactorEnabled: adminData.twoFactorEnabled,
          sessions,
        },
      },
    });
  } catch (error) {
    console.error("Admin settings GET error:", error);

    return NextResponse.json(
      { message: "Unable to load admin settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    if (body.section === "profile") {
      const parsed = profileSchema.safeParse(body.data);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Please provide valid profile details." },
          { status: 400 },
        );
      }

      const email = parsed.data.email.toLowerCase();

      const existing = await prisma.adminUser.findFirst({
        where: {
          email,
          NOT: {
            id: admin.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        return NextResponse.json(
          { message: "That email address is already in use." },
          { status: 409 },
        );
      }

      const updated = await prisma.adminUser.update({
        where: {
          id: admin.id,
        },
        data: {
          name: parsed.data.name,
          email,
          phoneNumber: parsed.data.phoneNumber?.trim() || null,
        },
        select: {
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATE_PROFILE",
          entity: "ADMIN_USER",
          entityId: admin.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully.",
        data: updated,
      });
    }

    if (body.section === "gameDefaults") {
      const parsed = gameSettingsSchema.safeParse(body.data);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Please provide valid game settings." },
          { status: 400 },
        );
      }

      const existing = await prisma.gameSettings.findFirst();

      const settings = existing
        ? await prisma.gameSettings.update({
            where: {
              id: existing.id,
            },
            data: parsed.data,
          })
        : await prisma.gameSettings.create({
            data: parsed.data,
          });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATE_GAME_SETTINGS",
          entity: "GAME_SETTINGS",
          entityId: settings.id,
          details: parsed.data,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Game defaults saved successfully.",
      });
    }

    if (body.section === "notifications") {
      const parsed = notificationSchema.safeParse(body.data);

      if (!parsed.success) {
        return NextResponse.json(
          { message: "Invalid notification preferences." },
          { status: 400 },
        );
      }

      await prisma.adminUser.update({
        where: {
          id: admin.id,
        },
        data: parsed.data,
      });

      return NextResponse.json({
        success: true,
        message: "Notification preferences saved.",
      });
    }

    if (body.section === "security") {
      const enabled = Boolean(body.data?.twoFactorEnabled);

      await prisma.adminUser.update({
        where: {
          id: admin.id,
        },
        data: {
          twoFactorEnabled: enabled,
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: enabled ? "ENABLE_2FA" : "DISABLE_2FA",
          entity: "ADMIN_USER",
          entityId: admin.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: enabled
          ? "Two-factor authentication enabled."
          : "Two-factor authentication disabled.",
      });
    }

    if (body.section === "password") {
      const parsed = passwordSchema.safeParse(body.data);

      if (!parsed.success) {
        return NextResponse.json(
          {
            message: "Password must be at least 8 characters.",
          },
          { status: 400 },
        );
      }

      const adminRecord = await prisma.adminUser.findUnique({
        where: {
          id: admin.id,
        },
        select: {
          passwordHash: true,
        },
      });

      if (!adminRecord) {
        return NextResponse.json(
          { message: "Admin account not found." },
          { status: 404 },
        );
      }

      const validPassword = await bcrypt.compare(
        parsed.data.currentPassword,
        adminRecord.passwordHash,
      );

      if (!validPassword) {
        return NextResponse.json(
          { message: "Current password is incorrect." },
          { status: 400 },
        );
      }

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

      await prisma.adminUser.update({
        where: {
          id: admin.id,
        },
        data: {
          passwordHash,
        },
      });

      await prisma.adminSession.deleteMany({
        where: {
          adminId: admin.id,
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: "CHANGE_PASSWORD",
          entity: "ADMIN_USER",
          entityId: admin.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password updated. Please sign in again.",
      });
    }

    return NextResponse.json(
      { message: "Invalid settings section." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Admin settings PATCH error:", error);

    return NextResponse.json(
      { message: "Unable to save admin settings." },
      { status: 500 },
    );
  }
}
