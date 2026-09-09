import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/admin/session";
import type { AdminRole } from "@/app/generated/prisma/client";

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireAdminRole(
  allowedRoles: AdminRole[],
) {
  const admin = await requireAdmin();

  if (!allowedRoles.includes(admin.role)) {
    redirect("/admin");
  }

  return admin;
}
