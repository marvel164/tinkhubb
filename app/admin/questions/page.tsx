import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
import QuestionsClient from "./questions-client";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

export default async function QuestionsPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      adminName={admin.name}
      adminEmail={admin.email}
      adminRole={admin.role}
      active="questions"
    >
      <QuestionsClient />
    </AdminShell>
  );
}
