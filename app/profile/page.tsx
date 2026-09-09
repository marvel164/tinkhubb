"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Flame,
  Gamepad2,
  Medal,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type RecentGame = {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAnswered: number;
  completedAt: string | null;
  durationSeconds: number | null;
};

type ProfileData = {
  username: string;
  phone: string;
  totalPoints: number;
  rank: number;
  gamesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  recentGames: RecentGame[];
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

function maskPhone(phone: string) {
  if (phone.length < 8) return phone;

  return `${phone.slice(0, 5)} ••••••• ${phone.slice(-4)}`;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401) {
          router.replace("/login?returnTo=%2Fprofile");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ?? "Unable to load your profile.",
          );
        }

        if (!cancelled) {
          setProfile(data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-[calc(100vh-72px)] bg-[#fffaf6] px-4 py-12 dark:bg-[#17110e]">
          <div className="mx-auto max-w-[1120px] animate-pulse">
            <div className="h-8 w-48 rounded bg-[#f3e4d8] dark:bg-[#2b211c]" />
            <div className="mt-3 h-4 w-72 rounded bg-[#f3e4d8] dark:bg-[#2b211c]" />

            <div className="mt-8 grid gap-4 md:grid-cols-[1.2fr_2fr]">
              <div className="h-64 rounded-[18px] bg-white dark:bg-[#211914]" />
              <div className="h-64 rounded-[18px] bg-white dark:bg-[#211914]" />
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#fffaf6] px-5 dark:bg-[#17110e]">
          <div className="w-full max-w-[430px] rounded-[18px] border border-[#f1dfd1] bg-white p-8 text-center shadow-[0_12px_40px_rgba(69,25,0,0.06)] dark:border-[#382920] dark:bg-[#211914]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ff6b00]">
              TinkHubb
            </p>

            <h1 className="mt-3 text-2xl font-bold text-[#451900] dark:text-[#fff4ec]">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#73777d] dark:text-[#b9aaa1]">
              {error || "We couldn't load your profile right now."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-[4px] bg-[#ff6b00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e96000]"
            >
              Try Again
            </button>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  const nextMilestone =
    profile.currentStreak < 7
      ? 7
      : profile.currentStreak < 14
        ? 14
        : profile.currentStreak < 30
          ? 30
          : null;

  const streakProgress = nextMilestone
    ? Math.min(
        100,
        Math.round((profile.currentStreak / nextMilestone) * 100),
      )
    : 100;

  return (
    <>
      <Navbar />

      <main className="min-h-[calc(100vh-72px)] bg-[#fffaf6] dark:bg-[#17110e]">
        <section className="border-b border-[#f2e3d8] bg-[#fffaf6] px-4 py-12 dark:border-[#30241e] dark:bg-[#1b1410] md:py-16">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid gap-8 md:grid-cols-[1.1fr_1.9fr] md:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff6b00]">
                  MY PROFILE
                </p>

                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border border-[#ffd4b7] bg-[#fff0e5] text-[#ff6b00] dark:border-[#5b3825] dark:bg-[#302019]">
                    <UserRound size={32} strokeWidth={1.7} />
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#451900] dark:text-[#fff4ec]">
                      {profile.username}
                    </h1>

                    <p className="mt-1 text-sm text-[#73777d] dark:text-[#b9aaa1]">
                      {maskPhone(profile.phone)}
                    </p>
                  </div>
                </div>

                <p className="mt-5 max-w-[430px] text-sm leading-6 text-[#73777d] dark:text-[#b9aaa1]">
                  Your TinkHubb progress, performance and daily streak all in
                  one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Points",
                    value: profile.totalPoints.toLocaleString(),
                    icon: Trophy,
                  },
                  {
                    label: "Rank",
                    value: `#${profile.rank}`,
                    icon: Medal,
                  },
                  {
                    label: "Games",
                    value: profile.gamesPlayed.toLocaleString(),
                    icon: Gamepad2,
                  },
                  {
                    label: "Accuracy",
                    value: `${profile.accuracy}%`,
                    icon: Target,
                  },
                ].map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-[14px] border border-[#f0dfd3] bg-white p-4 shadow-[0_8px_28px_rgba(69,25,0,0.04)] dark:border-[#382920] dark:bg-[#211914]"
                    >
                      <Icon
                        size={18}
                        className="text-[#ff6b00]"
                        strokeWidth={1.8}
                      />

                      <p className="mt-4 text-xl font-bold text-[#451900] dark:text-[#fff4ec]">
                        {stat.value}
                      </p>

                      <p className="mt-1 text-[11px] text-[#85888d] dark:text-[#a99a91]">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 md:py-14">
          <div className="mx-auto grid max-w-[1120px] gap-5 lg:grid-cols-[1.55fr_1fr]">
            <div className="rounded-[18px] border border-[#f0dfd3] bg-white p-6 shadow-[0_12px_40px_rgba(69,25,0,0.045)] dark:border-[#382920] dark:bg-[#211914] md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff6b00]">
                    DAILY STREAK
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#451900] dark:text-[#fff4ec]">
                    Keep the flame alive.
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e5] text-[#ff6b00] dark:bg-[#302019]">
                  <Flame size={25} strokeWidth={1.8} />
                </div>
              </div>

              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
                    {profile.currentStreak}
                  </p>
                  <p className="mt-1 text-xs text-[#73777d] dark:text-[#b9aaa1]">
                    current day streak
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-[#451900] dark:text-[#fff4ec]">
                    {profile.longestStreak}
                  </p>
                  <p className="mt-1 text-xs text-[#73777d] dark:text-[#b9aaa1]">
                    longest streak
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <div className="h-2 overflow-hidden rounded-full bg-[#f5e8df] dark:bg-[#342720]">
                  <div
                    className="h-full rounded-full bg-[#ff6b00] transition-all"
                    style={{ width: `${streakProgress}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-[10px] font-semibold text-[#8a8d91] dark:text-[#a99a91]">
                  <span>7 days</span>
                  <span>14 days</span>
                  <span>30 days</span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-[#73777d] dark:text-[#b9aaa1]">
                {nextMilestone
                  ? `${nextMilestone - profile.currentStreak} more day${
                      nextMilestone - profile.currentStreak === 1 ? "" : "s"
                    } to your ${nextMilestone}-day milestone.`
                  : "You've passed the 30-day milestone. Keep going."}
              </p>
            </div>

            <div className="rounded-[18px] border border-[#f0dfd3] bg-white p-6 shadow-[0_12px_40px_rgba(69,25,0,0.045)] dark:border-[#382920] dark:bg-[#211914] md:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff6b00]">
                PERFORMANCE
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#451900] dark:text-[#fff4ec]">
                Your numbers.
              </h2>

              <div className="mt-7 space-y-5">
                <div className="flex items-center justify-between border-b border-[#f3e8e1] pb-4 dark:border-[#342720]">
                  <span className="text-sm text-[#73777d] dark:text-[#b9aaa1]">
                    Questions answered
                  </span>
                  <strong className="text-sm text-[#451900] dark:text-[#fff4ec]">
                    {profile.questionsAnswered}
                  </strong>
                </div>

                <div className="flex items-center justify-between border-b border-[#f3e8e1] pb-4 dark:border-[#342720]">
                  <span className="text-sm text-[#73777d] dark:text-[#b9aaa1]">
                    Correct answers
                  </span>
                  <strong className="text-sm text-[#451900] dark:text-[#fff4ec]">
                    {profile.correctAnswers}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#73777d] dark:text-[#b9aaa1]">
                    Accuracy
                  </span>
                  <strong className="text-sm text-[#ff6b00]">
                    {profile.accuracy}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 md:pb-16">
          <div className="mx-auto max-w-[1120px]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff6b00]">
                  RECENT GAMES
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#451900] dark:text-[#fff4ec]">
                  Your latest rounds.
                </h2>
              </div>

              <Link
                href="/leaderboard"
                className="hidden items-center gap-1.5 text-xs font-semibold text-[#ff6b00] sm:flex"
              >
                View leaderboard
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-[18px] border border-[#f0dfd3] bg-white shadow-[0_12px_40px_rgba(69,25,0,0.045)] dark:border-[#382920] dark:bg-[#211914]">
              {profile.recentGames.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Gamepad2
                    size={28}
                    className="mx-auto text-[#ff6b00]"
                    strokeWidth={1.6}
                  />
                  <p className="mt-3 text-sm font-semibold text-[#451900] dark:text-[#fff4ec]">
                    No completed games yet.
                  </p>
                  <p className="mt-1 text-xs text-[#73777d] dark:text-[#b9aaa1]">
                    Play your first game and your results will appear here.
                  </p>

                  <Link
                    href="/play"
                    className="mt-5 inline-flex rounded-[4px] bg-[#ff6b00] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#e96000]"
                  >
                    Play Now
                  </Link>
                </div>
              ) : (
                <div>
                  {profile.recentGames.map((game, index) => (
                    <div
                      key={game.id}
                      className={`grid gap-3 px-5 py-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center ${
                        index !== profile.recentGames.length - 1
                          ? "border-b border-[#f3e8e1] dark:border-[#342720]"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-[#451900] dark:text-[#fff4ec]">
                          {game.score} points
                        </p>
                        <p className="mt-1 text-[11px] text-[#85888d] dark:text-[#a99a91]">
                          {formatDate(game.completedAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#451900] dark:text-[#fff4ec]">
                          {game.correctAnswers}/{game.totalQuestions}
                        </p>
                        <p className="text-[10px] text-[#85888d] dark:text-[#a99a91]">
                          correct
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#451900] dark:text-[#fff4ec]">
                          {game.questionsAnswered
                            ? Math.round(
                                (game.correctAnswers /
                                  game.questionsAnswered) *
                                  100,
                              )
                            : 0}
                          %
                        </p>
                        <p className="text-[10px] text-[#85888d] dark:text-[#a99a91]">
                          accuracy
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#451900] dark:text-[#fff4ec]">
                          {formatDuration(game.durationSeconds)}
                        </p>
                        <p className="text-[10px] text-[#85888d] dark:text-[#a99a91]">
                          duration
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/play"
              className="mt-6 flex h-[48px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#ff6b00] text-sm font-semibold text-white transition hover:bg-[#e96000] sm:hidden"
            >
              Play Another Game
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
