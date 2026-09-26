"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to sign in.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-4 py-8 text-[#121212] sm:py-10">
      <div className="w-full max-w-[430px]">
        <div className="mb-7 text-center sm:mb-8">
          <p className="text-[22px] font-bold tracking-[-0.03em]">Tinkhupp</p>

          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7278] sm:text-xs">
            Admin Portal
          </p>
        </div>

        <div className="rounded-[8px] border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-7">
          <div className="mb-6 sm:mb-7">
            <h1 className="text-[23px] font-bold tracking-[-0.02em] sm:text-[24px]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#6f7278]">
              Sign in to manage Tinkhupp Trivia.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold text-[#121212]"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  strokeWidth={1.8}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6f7278]"
                  aria-hidden="true"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                  className="h-11 w-full rounded-[5px] border border-[#dedede] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold text-[#121212]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  strokeWidth={1.8}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6f7278]"
                  aria-hidden="true"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-11 w-full rounded-[5px] border border-[#dedede] bg-white pl-10 pr-11 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[4px] text-[#6f7278] transition hover:bg-[#f5f5f5] hover:text-[#121212] focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/15"
                >
                  {showPassword ? (
                    <EyeOff size={17} strokeWidth={1.8} aria-hidden="true" />
                  ) : (
                    <Eye size={17} strokeWidth={1.8} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-[5px] border border-[#f2c7c7] bg-[#fff3f3] px-3.5 py-3 text-xs leading-5 text-[#b42318]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-[5px] bg-[#ff6b00] text-sm font-semibold text-white transition hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#8a8d92] sm:mt-6">
          Tinkhupp Trivia · Admin Access
        </p>
      </div>
    </main>
  );
}
