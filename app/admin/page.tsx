import { requireAdmin } from "@/lib/auth/admin/guard";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <main className="min-h-screen bg-[#f7f7f7] p-8 text-[#121212]">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff6b00]">
          TinkHubb Admin
        </p>

        <h1 className="mt-3 text-3xl font-bold">Dashboard</h1>

        <p className="mt-2 text-sm text-[#6f7278]">
          Welcome, {admin.name}.
        </p>

        <div className="mt-8 rounded-[6px] border border-[#e5e5e5] bg-white p-6">
          <p className="text-sm font-semibold">
            Admin authentication is working.
          </p>

          <p className="mt-2 text-xs text-[#6f7278]">
            Signed in as {admin.email} · {admin.role}
          </p>
        </div>
      </div>
    </main>
  );
}
