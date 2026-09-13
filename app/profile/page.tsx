"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Medal, Trophy, UserRound } from "lucide-react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type Achievement = {
  type: string;
  label: string;
  unlocked: boolean;
};

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
  createdAt: string;
  totalPoints: number;
  rank: number;
  gamesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  achievements: Achievement[];
  recentGames: RecentGame[];
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function maskPhone(phone: string) {
  if (phone.length < 8) return phone;

  return `${phone.slice(0, 5)} ••••••• ${phone.slice(-4)}`;
}

function AchievementIcon({ type }: { type: string }) {
  if (type.startsWith("STREAK")) {
    return <Flame size={18} strokeWidth={1.8} />;
  }

  if (type === "PERFECT_ROUND") {
    return <Trophy size={18} strokeWidth={1.7} />;
  }

  return <Medal size={18} strokeWidth={1.7} />;
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
          throw new Error(data.message ?? "Unable to load your profile.");
        }

        if (!cancelled) {
          setProfile(data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load your profile.",
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
          <div className="mx-auto max-w-[980px] animate-pulse">
            <div className="h-20 rounded-[5px] bg-white dark:bg-[#211914]" />

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[72px] rounded-[5px] bg-white dark:bg-[#211914]"
                />
              ))}
            </div>

            <div className="mt-4 h-[220px] rounded-[5px] bg-white dark:bg-[#211914]" />
            <div className="mt-4 h-[280px] rounded-[5px] bg-white dark:bg-[#211914]" />
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
          <div className="w-full max-w-[430px] rounded-[6px] border border-[#f1dfd1] bg-white p-8 text-center shadow-[0_12px_40px_rgba(69,25,0,0.06)] dark:border-[#382920] dark:bg-[#211914]">
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

  return (
    <>
      <Navbar />

      <main className="min-h-[calc(100vh-72px)] bg-[#fffaf6] dark:bg-[#17110e]">
        <section className="px-4 pb-12 pt-12 md:pb-14 md:pt-16">
          <div className="mx-auto max-w-[980px]">
            {/* Profile identity */}
            <div className="flex flex-col gap-4 rounded-[5px] border border-[#eee4dc] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(69,25,0,0.025)] dark:border-[#382920] dark:bg-[#211914] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#ffd6bc] bg-[#fff0e5] text-[#ff6b00] dark:border-[#5b3825] dark:bg-[#302019]">
                  <UserRound size={23} strokeWidth={1.7} />
                </div>

                <div>
                  <h1 className="text-[13px] font-bold text-[#451900] dark:text-[#fff4ec]">
                    {profile.username}
                  </h1>

                  <p className="mt-1 text-[10px] text-[#73777d] dark:text-[#aaa098]">
                    Phone Number · {maskPhone(profile.phone)}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-[#73777d] dark:text-[#aaa098] sm:text-right">
                Joined {formatJoinedDate(profile.createdAt)}
              </p>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-[5px] border border-[#eee4dc] bg-white px-4 py-4 dark:border-[#382920] dark:bg-[#211914]">
                <p className="text-[16px] font-bold text-[#451900] dark:text-[#fff4ec]">
                  {profile.totalPoints.toLocaleString()}
                </p>
                <p className="mt-1 text-[9px] text-[#73777d] dark:text-[#aaa098]">
                  Total Points
                </p>
              </div>

              <div className="rounded-[5px] border border-[#eee4dc] bg-white px-4 py-4 dark:border-[#382920] dark:bg-[#211914]">
                <p className="text-[16px] font-bold text-[#451900] dark:text-[#fff4ec]">
                  #{profile.rank}
                </p>
                <p className="mt-1 text-[9px] text-[#73777d] dark:text-[#aaa098]">
                  Leaderboard Rank
                </p>
              </div>

              <div className="rounded-[5px] border border-[#eee4dc] bg-white px-4 py-4 dark:border-[#382920] dark:bg-[#211914]">
                <div className="flex items-center gap-1.5">
                  <Flame
                    size={15}
                    className="text-[#ff6b00]"
                    strokeWidth={1.8}
                  />
                  <p className="text-[16px] font-bold text-[#451900] dark:text-[#fff4ec]">
                    {profile.currentStreak}
                  </p>
                </div>

                <p className="mt-1 text-[9px] text-[#73777d] dark:text-[#aaa098]">
                  Current Streak
                </p>
              </div>

              <div className="rounded-[5px] border border-[#eee4dc] bg-white px-4 py-4 dark:border-[#382920] dark:bg-[#211914]">
                <p className="text-[16px] font-bold text-[#451900] dark:text-[#fff4ec]">
                  {profile.gamesPlayed.toLocaleString()}
                </p>
                <p className="mt-1 text-[9px] text-[#73777d] dark:text-[#aaa098]">
                  Games Played
                </p>
              </div>
            </div>

            {/* Achievement badges */}
            <section className="mt-4 rounded-[5px] border border-[#eee4dc] bg-white p-5 shadow-[0_4px_18px_rgba(69,25,0,0.025)] dark:border-[#382920] dark:bg-[#211914] sm:p-6">
              <h2 className="text-[12px] font-bold text-[#451900] dark:text-[#fff4ec]">
                Achievement Badges
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {profile.achievements.map((achievement) => (
                  <div
                    key={achievement.type}
                    className={`flex min-h-[62px] flex-col items-center justify-center rounded-[5px] border px-2 py-3 text-center transition-colors ${
                      achievement.unlocked
                        ? "border-[#ffd0b0] bg-[#fff0e3] text-[#451900] dark:border-[#6a3e27] dark:bg-[#35231b] dark:text-[#fff4ec]"
                        : "border-[#e2e2e4] bg-[#eeeeef] text-[#b1b1b4] dark:border-[#403a37] dark:bg-[#302c29] dark:text-[#77716d]"
                    }`}
                  >
                    <span
                      className={
                        achievement.unlocked
                          ? "text-[#ff6b00]"
                          : "text-[#a8a8ab]"
                      }
                    >
                      <AchievementIcon type={achievement.type} />
                    </span>

                    <span className="mt-2 text-[9px] font-semibold leading-3.5">
                      {achievement.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent sessions */}
            <section className="mt-4 overflow-hidden rounded-[5px] border border-[#eee4dc] bg-white shadow-[0_4px_18px_rgba(69,25,0,0.025)] dark:border-[#382920] dark:bg-[#211914]">
              <div className="px-5 pb-3 pt-5 sm:px-6">
                <h2 className="text-[12px] font-bold text-[#451900] dark:text-[#fff4ec]">
                  Recent Sessions
                </h2>

                <p className="mt-1 text-[9px] text-[#73777d] dark:text-[#aaa098]">
                  Most recent completed quiz sessions
                </p>
              </div>

              {profile.recentGames.length === 0 ? (
                <div className="border-t border-[#eee8e3] px-6 py-12 text-center dark:border-[#342720]">
                  <p className="text-[11px] font-semibold text-[#451900] dark:text-[#fff4ec]">
                    No completed games yet.
                  </p>

                  <p className="mt-1 text-[10px] text-[#73777d] dark:text-[#aaa098]">
                    Play your first game and your results will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-[1fr_1fr_1fr] border-t border-[#eee8e3] px-5 py-3 dark:border-[#342720] sm:px-6">
                      <p className="text-[9px] font-semibold uppercase text-[#73777d] dark:text-[#aaa098]">
                        Date
                      </p>

                      <p className="text-[9px] font-semibold uppercase text-[#73777d] dark:text-[#aaa098]">
                        Score
                      </p>

                      <p className="text-right text-[9px] font-semibold uppercase text-[#73777d] dark:text-[#aaa098]">
                        Points Earned
                      </p>
                    </div>

                    {profile.recentGames.map((game) => (
                      <div
                        key={game.id}
                        className="grid grid-cols-[1fr_1fr_1fr] border-t border-[#eee8e3] px-5 py-3 dark:border-[#342720] sm:px-6"
                      >
                        <p className="text-[10px] text-[#451900] dark:text-[#fff4ec]">
                          {formatDate(game.completedAt)}
                        </p>

                        <p className="text-[10px] text-[#451900] dark:text-[#fff4ec]">
                          {game.score}/{game.totalQuestions}
                        </p>

                        <p className="text-right text-[10px] font-semibold text-[#451900] dark:text-[#fff4ec]">
                          +{game.score}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
