import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import PlayerManagementClient from "./player-management-client";

export default async function PlayerManagementPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
      active="users"
    >
      <PlayerManagementClient />
    </AdminShell>
  );
}
