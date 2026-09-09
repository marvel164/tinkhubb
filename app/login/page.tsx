"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import Navbar from "@/components/navbar";

function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/play";
  }

  return value;
}

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to sign in.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const returnTo = getSafeReturnTo(params.get("returnTo"));

      router.push(
        `/login/verify?phone=${encodeURIComponent(
          data.data.phone,
        )}&returnTo=${encodeURIComponent(returnTo)}`,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goToRegister() {
    const params = new URLSearchParams(window.location.search);
    const returnTo = getSafeReturnTo(params.get("returnTo"));

    router.push(`/register?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-[520px]">
          <div className="rounded-[12px] border border-[#eadfd6] bg-white px-7 py-9 shadow-[0_15px_45px_rgba(69,25,0,0.06)] transition-colors duration-200 dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_15px_45px_rgba(0,0,0,0.2)] sm:px-12 sm:py-11">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                WELCOME BACK
              </p>

              <h1 className="mt-4 text-[29px] font-extrabold tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
                Sign in to TinkHubb
              </h1>

              <p className="mx-auto mt-3 max-w-[390px] text-[12px] leading-6 text-[#6f7278] dark:text-[#b9aaa2]">
                Enter the phone number linked to your TinkHubb account.
                We&apos;ll send you a verification code to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10">
              <label
                htmlFor="phone"
                className="mb-2 block text-[11px] font-bold text-[#451900] dark:text-[#eee3dd]"
              >
                Phone Number
              </label>

              <div className="relative">
                <Phone
                  size={15}
                  strokeWidth={1.7}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b7a89f] dark:text-[#8e7c72]"
                />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+234 000 000 0000"
                  autoComplete="tel"
                  required
                  disabled={loading}
                  className="h-[48px] w-full rounded-[7px] border border-transparent bg-[#fff0e6] pl-10 pr-4 text-[12px] text-[#451900] outline-none transition placeholder:text-[#b9aaa1] focus:border-[#FF6B00] dark:bg-[#35251d] dark:text-[#fff4ec] dark:placeholder:text-[#806f66]"
                />
              </div>

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
                disabled={loading}
                className="mt-8 h-[48px] w-full rounded-[7px] bg-[#FF6B00] text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(255,107,0,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#e95f00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending Code..." : "Continue"}
              </button>

              <p className="mt-6 text-center text-[11px] text-[#6f7278] dark:text-[#a99b93]">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={goToRegister}
                  className="font-bold text-[#FF6B00] hover:underline"
                >
                  Register
                </button>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
