"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type InviteData = {
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
};

export default function AdminInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const token = params.token;

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      try {
        const response = await fetch(`/api/admin/invites/${token}`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "This invitation is no longer valid.",
          );
        }

        setInvite(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load invitation.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInvite();
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/invites/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to create your admin account.",
        );
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/login");
      }, 1600);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your admin account.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4 py-10 text-[#171717] dark:bg-[#15120f] dark:text-[#fff4ec]">
      <div className="w-full max-w-[430px] rounded-[6px] border border-[#e6e7e9] bg-white p-7 shadow-sm dark:border-[#342a24] dark:bg-[#1b1714]">
        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[#ff6b00]" />
          </div>
        ) : success ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={42} className="mx-auto text-[#167044]" />

            <h1 className="mt-4 text-[20px] font-bold">
              Admin account created
            </h1>

            <p className="mt-2 text-[11px] text-[#777b80] dark:text-[#a99d96]">
              Redirecting you to the admin login...
            </p>
          </div>
        ) : invite ? (
          <>
            <div className="text-center">
              <ShieldCheck size={28} className="mx-auto text-[#ff6b00]" />

              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#ff6b00]">
                Tinkhupp Admin
              </p>

              <h1 className="mt-2 text-[20px] font-bold">
                Complete your invitation
              </h1>

              <p className="mt-2 text-[10px] leading-4 text-[#777b80] dark:text-[#a99d96]">
                You have been invited as{" "}
                <strong>
                  {invite.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                </strong>
                .
              </p>
            </div>

            <div className="mt-6 rounded-[4px] bg-[#fff7f1] p-3 dark:bg-[#241b16]">
              <p className="text-[10px] font-semibold">{invite.name}</p>

              <p className="mt-1 text-[9px] text-[#777b80] dark:text-[#a99d96]">
                {invite.email}
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-[4px] border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] text-red-700 dark:border-[#5a3028] dark:bg-[#291a17] dark:text-[#ffb4a8]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[9px] font-semibold">
                  Password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  className="h-10 w-full rounded-[3px] border border-[#e5e6e8] bg-[#f7f7f7] px-3 text-[10px] outline-none focus:border-[#ff6b00] dark:border-[#40352e] dark:bg-[#241e1a]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[9px] font-semibold">
                  Confirm Password
                </span>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  className="h-10 w-full rounded-[3px] border border-[#e5e6e8] bg-[#f7f7f7] px-3 text-[10px] outline-none focus:border-[#ff6b00] dark:border-[#40352e] dark:bg-[#241e1a]"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="h-10 w-full rounded-[3px] bg-[#ff6b00] text-[10px] font-semibold text-white hover:bg-[#e96000] disabled:opacity-60"
              >
                {saving ? "Creating Account..." : "Create Admin Account"}
              </button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <h1 className="text-[18px] font-bold">Invitation unavailable</h1>

            <p className="mt-2 text-[10px] text-[#777b80] dark:text-[#a99d96]">
              {error || "This invitation is invalid or has expired."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
