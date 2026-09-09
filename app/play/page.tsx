"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock3, Flame, Play, Sparkles } from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function PlayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startGame() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/game/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?returnTo=%2Fplay");
          return;
        }

        setError(data.message ?? "Unable to start the game.");
        return;
      }

      router.push(`/play/${data.data.gameId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      <main>
        {/* PRE-GAME HERO */}
        <section className="relative overflow-hidden bg-[#fffaf6] dark:bg-[#17110e]">
          <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[#fff0e5] blur-3xl dark:bg-[#3a2015]" />
          <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#ffe8d7] blur-3xl dark:bg-[#3b2115]" />

          <div className="relative mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1200px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.82fr] lg:gap-20 lg:px-12 lg:py-24">
            {/* LEFT */}
            <div className="max-w-[620px]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FF6B00] sm:text-[11px]">
                TODAY&apos;S GAME
              </p>

              <h1 className="mt-5 text-[43px] font-extrabold leading-[0.98] tracking-[-0.055em] text-[#451900] dark:text-[#fff4ec] sm:text-[56px] md:text-[66px]">
                Are you ready
                <br />
                for today&apos;s
                <br />
                <span className="text-[#FF6B00]">game?</span>
              </h1>

              <p className="mt-7 max-w-[510px] text-[14px] leading-7 text-[#786b63] dark:text-[#c1b4ad] sm:text-[15px]">
                Ten questions. One timed round. Every correct answer gets
                you closer to the top of the TinkHubb leaderboard.
              </p>

              <div className="mt-8 grid max-w-[470px] grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-[10px] border border-[#f0dfd5] bg-white px-4 py-4 dark:border-[#49352c] dark:bg-[#241b17]">
                  <p className="text-[23px] font-extrabold tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
                    10
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8c7d74] dark:text-[#aa9b93]">
                    Questions
                  </p>
                </div>

                <div className="rounded-[10px] border border-[#f0dfd5] bg-white px-4 py-4 dark:border-[#49352c] dark:bg-[#241b17]">
                  <div className="flex items-center gap-2">
                    <Clock3 size={17} className="text-[#FF6B00]" />
                    <p className="text-[23px] font-extrabold tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
                      10
                    </p>
                  </div>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8c7d74] dark:text-[#aa9b93]">
                    Minutes
                  </p>
                </div>

                <div className="col-span-2 rounded-[10px] border border-[#f0dfd5] bg-white px-4 py-4 dark:border-[#49352c] dark:bg-[#241b17] sm:col-span-1">
                  <div className="flex items-center gap-2">
                    <Flame size={17} className="text-[#FF6B00]" />
                    <p className="text-[23px] font-extrabold tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
                      1+
                    </p>
                  </div>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8c7d74] dark:text-[#aa9b93]">
                    To Keep Streak
                  </p>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 max-w-[470px] rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={startGame}
                  disabled={loading}
                  className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[7px] bg-[#FF6B00] px-8 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(255,107,0,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e95f00] hover:shadow-[0_14px_30px_rgba(255,107,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:ring-offset-2 focus:ring-offset-[#fffaf6] disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-[#17110e]"
                >
                  <Play size={14} fill="currentColor" />
                  {loading ? "Starting Game..." : "Start Game"}
                  {!loading && (
                    <ArrowRight
                      size={14}
                      strokeWidth={2.5}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  )}
                </button>

                <Link
                  href="/how-it-works"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-[7px] border border-[#eddcd2] bg-white px-7 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6f5e54] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffb27d] hover:text-[#FF6B00] dark:border-[#49352c] dark:bg-[#241b17] dark:text-[#c9bcb5] dark:hover:border-[#76523d] dark:hover:text-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20"
                >
                  How It Works
                </Link>
              </div>

              <p className="mt-6 flex items-center gap-2 text-[10px] font-semibold text-[#9a887e] dark:text-[#a99b93]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                Your game starts as soon as you press Start Game.
              </p>
            </div>

            {/* RIGHT GAME PREVIEW */}
            <div className="relative mx-auto w-full max-w-[430px]">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#ffe2cd] blur-3xl dark:bg-[#5a2c13]" />

              <div className="relative rounded-[20px] border border-[#f0ded4] bg-white p-5 shadow-[0_25px_70px_rgba(69,25,0,0.08)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_25px_70px_rgba(0,0,0,0.25)] sm:p-7">
                <div className="flex items-center justify-between border-b border-[#f1e5df] pb-5 dark:border-[#3b2d26]">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#FF6B00]">
                      TINKHUBB TRIVIA
                    </p>

                    <p className="mt-1 text-[13px] font-extrabold text-[#451900] dark:text-[#fff4ec]">
                      Your next round
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e6] dark:bg-[#352219]">
                    <Sparkles
                      size={18}
                      strokeWidth={1.8}
                      className="text-[#FF6B00]"
                    />
                  </div>
                </div>

                <div className="py-7">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8c7c73] dark:text-[#a99b93]">
                      ROUND
                    </span>

                    <span className="text-[10px] font-extrabold text-[#FF6B00]">
                      10 QUESTIONS
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f2e2d9] dark:bg-[#403029]">
                    <div className="h-full w-[40%] rounded-full bg-[#FF6B00]" />
                  </div>

                  <div className="mt-7 rounded-[12px] border border-[#eee0d8] bg-[#fffaf7] p-5 dark:border-[#49352c] dark:bg-[#1d1613]">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#fff0e6] px-3 py-1.5 text-[9px] font-extrabold text-[#FF6B00] dark:bg-[#352219]">
                        GENERAL KNOWLEDGE
                      </span>

                      <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF6B00]">
                        <Clock3 size={14} />
                        60s
                      </span>
                    </div>

                    <p className="mt-5 text-[19px] font-extrabold leading-tight tracking-[-0.025em] text-[#451900] dark:text-[#fff4ec]">
                      Think fast and choose your answer.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      {["A", "B", "C", "D"].map((letter, index) => (
                        <div
                          key={letter}
                          className={`rounded-[8px] border px-3 py-3 ${
                            index === 0
                              ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                              : "border-[#eee0d8] bg-white text-[#685951] dark:border-[#49352c] dark:bg-[#241b17] dark:text-[#d1c4bc]"
                          }`}
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[9px] font-extrabold dark:bg-white/10">
                            {letter}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#f1e5df] pt-5 dark:border-[#3b2d26]">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-[#FF6B00]" />
                    <span className="text-[10px] font-bold text-[#76675f] dark:text-[#c1b4ad]">
                      Keep your streak alive
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold text-[#FF6B00]">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM NOTE */}
        <section className="border-t border-[#f2ddd1] bg-[#fff2e9] dark:border-[#49352c] dark:bg-[#2b1d17]">
          <div className="mx-auto flex max-w-[900px] flex-col items-center px-5 py-14 text-center sm:px-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#FF6B00]">
              ONE ROUND. TEN QUESTIONS.
            </p>

            <p className="mt-4 max-w-[600px] text-[13px] leading-6 text-[#786b63] dark:text-[#c1b4ad]">
              Finish at least one round today to protect your daily streak.
              Your score and ranking are updated after the game.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
