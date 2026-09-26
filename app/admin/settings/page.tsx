import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import SettingsClient from "./settings-client";

export default async function AdminSettingsPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <SettingsClient
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
    />
  );
}
