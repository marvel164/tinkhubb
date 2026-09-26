import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/app/generated/prisma/client";

type CreateAdminNotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  adminId?: string;
};

type NotificationPreferenceKey =
  | "suspiciousActivityAlerts"
  | "weeklyPerformanceSummary"
  | "streakMilestoneNotifications"
  | "adminTeamActivity";

const preferenceForType: Record<
  NotificationType,
  NotificationPreferenceKey | null
> = {
  NEW_USER: null,
  LEADERBOARD_TOPPED: "weeklyPerformanceSummary",
  LEADERBOARD_MOVEMENT: "weeklyPerformanceSummary",
  QUESTION_IMPORT: "adminTeamActivity",
  USER_SUSPENDED: "suspiciousActivityAlerts",
  STREAK_MILESTONE: "streakMilestoneNotifications",
  ADMIN_TEAM_ACTIVITY: "adminTeamActivity",
  SUSPICIOUS_ACTIVITY: "suspiciousActivityAlerts",
  SYSTEM: null,
};

export async function createAdminNotification(
  input: CreateAdminNotificationInput,
) {
  const preference = preferenceForType[input.type];

  const admins = await prisma.adminUser.findMany({
    where: {
      status: "ACTIVE",
      ...(input.adminId
        ? {
            id: input.adminId,
          }
        : {}),
      ...(preference
        ? {
            [preference]: true,
          }
        : {}),
    },
    select: {
      id: true,
    },
  });

  if (admins.length === 0) {
    return [];
  }

  return prisma.adminNotification.createMany({
    data: admins.map((admin) => ({
      type: input.type,
      title: input.title,
      message: input.message,
      userId: input.userId,
      adminId: admin.id,
    })),
  });
}
