"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Phone, UserRound } from "lucide-react";
import Navbar from "@/components/navbar";
import { Suspense } from "react";

function getSafeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/play";
  }

  return value;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to continue. Please try again.");
        return;
      }

      router.push(
        `/register/verify?username=${encodeURIComponent(
          data.data.username,
        )}&phone=${encodeURIComponent(
          data.data.phone,
        )}&returnTo=${encodeURIComponent(returnTo)}`,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-[520px]">
          <div className="rounded-[12px] border border-[#eadfd6] bg-white px-7 py-9 shadow-[0_15px_45px_rgba(69,25,0,0.06)] transition-colors duration-200 dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_15px_45px_rgba(0,0,0,0.2)] sm:px-12 sm:py-11">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
                GET STARTED
              </p>

              <h1 className="mt-4 text-[27px] font-extrabold tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec] sm:text-[29px]">
                Let&apos;s Get You Ready to Play
              </h1>

              <p className="mx-auto mt-3 max-w-[400px] text-[12px] leading-6 text-[#6f7278] dark:text-[#b9aaa2]">
                Choose a unique username, enter your phone number, take on
                exciting trivia challenges, earn points, build your daily
                streak, and compete for a spot on the leaderboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-[11px] font-bold text-[#451900] dark:text-[#eee3dd]"
                >
                  Enter your Username
                </label>

                <div className="relative">
                  <UserRound
                    size={15}
                    strokeWidth={1.7}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b7a89f] dark:text-[#8e7c72]"
                  />

                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="@-username"
                    autoComplete="username"
                    maxLength={20}
                    required
                    disabled={loading}
                    className="h-[48px] w-full rounded-[7px] border border-transparent bg-[#fff0e6] pl-10 pr-4 text-[12px] text-[#451900] outline-none transition placeholder:text-[#b9aaa1] focus:border-[#FF6B00] dark:bg-[#35251d] dark:text-[#fff4ec] dark:placeholder:text-[#806f66]"
                  />
                </div>
              </div>

              <div className="mt-7">
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
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-[7px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <div className="mt-7 flex items-start gap-2.5 rounded-[7px] border border-[#f1df9b] bg-[#fff9dc] px-3 py-3 dark:border-[#5a4b24] dark:bg-[#332b17]">
                <AlertTriangle
                  size={14}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-[#d69b00]"
                />

                <span className="text-[10px] font-medium leading-5 text-[#7d7040] dark:text-[#cbbd83]">
                  Identity verification is required for leaderboard placement.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 h-[48px] w-full rounded-[7px] bg-[#FF6B00] text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_8px_20px_rgba(255,107,0,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#e95f00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Checking..." : "Start Game"}
              </button>

              <p className="mt-6 text-center text-[11px] text-[#6f7278] dark:text-[#a99b93]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="font-bold text-[#FF6B00] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function RegisterFallback() {
  return (
    <main className="min-h-screen bg-[#fffaf6] dark:bg-[#17110e]">
      <Navbar />

      <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5">
        <p className="text-sm text-[#6f7278] dark:text-[#a99b93]">
          Loading registration...
        </p>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
