"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";

function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/play";
  }

  return value;
}

function VerifyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phone = searchParams.get("phone") ?? "";
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to verify code.");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-[520px]">
          <div className="rounded-[12px] border border-[#eadfd6] bg-white px-7 py-10 shadow-[0_15px_45px_rgba(69,25,0,0.06)] transition-colors duration-200 dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_15px_45px_rgba(0,0,0,0.2)] sm:px-12 sm:py-11">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                PHONE VERIFICATION
              </p>

              <h1 className="mt-4 text-[29px] font-extrabold tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
                Verify Your Phone
              </h1>

              <p className="mx-auto mt-3 max-w-[390px] text-[12px] leading-6 text-[#6f7278] dark:text-[#b9aaa2]">
                Enter the 6-digit verification code sent to your phone number to
                sign in to your TinkHubb account.
              </p>

              {phone && (
                <p className="mt-3 text-[11px] font-semibold text-[#765646] dark:text-[#cdb8aa]">
                  Code sent to {phone}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-10">
              <label
                htmlFor="code"
                className="mb-2 block text-[11px] font-bold text-[#451900] dark:text-[#eee3dd]"
              >
                Verification Code
              </label>

              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                required
                disabled={loading}
                className="h-[52px] w-full rounded-[7px] border border-transparent bg-[#fff0e6] px-4 text-center text-[21px] font-bold tracking-[0.35em] text-[#451900] outline-none transition placeholder:text-[#b9aaa1] focus:border-[#FF6B00] dark:bg-[#35251d] dark:text-[#fff4ec] dark:placeholder:text-[#806f66]"
              />

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-[7px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="mt-8 h-[48px] w-full rounded-[7px] bg-[#FF6B00] text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(255,107,0,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#e95f00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`)
                }
                className="mt-6 w-full text-center text-[10px] font-bold text-[#6f7278] transition-colors hover:text-[#FF6B00] dark:text-[#a99b93]"
              >
                Use a different phone number
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function VerifyLoginFallback() {
  return (
    <main className="min-h-screen bg-[#fffaf6] dark:bg-[#17110e]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5">
        <p className="text-sm text-[#6f7278] dark:text-[#a99b93]">
          Loading verification...
        </p>
      </section>
    </main>
  );
}

export default function VerifyLoginPage() {
  return (
    <Suspense fallback={<VerifyLoginFallback />}>
      <VerifyLoginForm />
    </Suspense>
  );
}
