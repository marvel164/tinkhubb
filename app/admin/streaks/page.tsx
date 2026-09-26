import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import StreaksClient from "./streaks-client";

export default async function AdminStreaksPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
      active="streaks"
    >
      <StreaksClient />
    </AdminShell>
  );
}
