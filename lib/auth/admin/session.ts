import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import type { AdminUser } from "@/app/generated/prisma/client";

const ADMIN_SESSION_COOKIE = "tinkhubb_admin_session";
const ADMIN_SESSION_DURATION_DAYS = 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() + ADMIN_SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.adminSession.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      admin: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.adminSession.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  if (session.admin.status !== "ACTIVE") {
    await prisma.adminSession.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  await prisma.adminSession.update({
    where: {
      id: session.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });

  return session.admin;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    });
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
