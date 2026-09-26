import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import WinnersClient from "./winners-client";

export default async function AdminWinnersPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <WinnersClient
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
    />
  );
}
