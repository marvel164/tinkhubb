"use client";

import {
  ArrowRight,
  Flame,
  Loader2,
  Medal,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type GameResult = {
  completed: boolean;
  gameId: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAnswered: number;
  totalQuestions: number;
  currentStreak?: number;
  longestStreak?: number;
};

type LeaderboardPlayer = {
  rank: number;
  id: string;
  username: string;
  totalPoints: number;
  weeklyPoints?: number;
  lifetimePoints?: number;
  dailyStreak: number;
};

type LeaderboardResponse = {
  weekly: LeaderboardPlayer[];
  global: LeaderboardPlayer[];
  currentUser: LeaderboardPlayer | null;
  totalPlayers: number;
  updatedAt: string;
};

function getResultMessage(
  correctAnswers: number,
  totalQuestions: number,
) {
  const accuracy =
    totalQuestions > 0
      ? (correctAnswers / totalQuestions) * 100
      : 0;

  if (accuracy === 100) {
    return "Perfect round!";
  }

  if (accuracy >= 80) {
    return "Excellent round!";
  }

  if (accuracy >= 60) {
    return "Solid round.";
  }

  if (accuracy >= 40) {
    return "Good effort.";
  }

  return "Keep playing.";
}

function formatPoints(points: number) {
  return points.toLocaleString();
}

function WeeklyPlayer({
  player,
}: {
  player: LeaderboardPlayer;
}) {
  const weeklyPoints =
    player.weeklyPoints ??
    player.totalPoints;

  return (
    <div className="flex items-center gap-4 border-b border-[#f1e8e2] px-5 py-4 transition-colors last:border-b-0 dark:border-[#38271f] sm:px-6">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
          player.rank === 1
            ? "bg-[#FF6B00] text-white"
            : "bg-[#ffe8d4] text-[#451900] dark:bg-[#3b2418] dark:text-[#ffd8bd]"
        }`}
      >
        {player.rank}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#451900] dark:text-[#fff4ec]">
          {player.username}
        </p>

        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6f7278] dark:text-[#b8aaa2]">
          <Flame
            size={12}
            fill="#FF6B00"
            className="text-[#FF6B00]"
          />
          {player.dailyStreak} day streak
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-black text-[#451900] dark:text-[#fff4ec]">
          {formatPoints(weeklyPoints)}
        </p>

        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9a8d85] dark:text-[#887a72]">
          weekly points
        </p>
      </div>
    </div>
  );
}

export default function GameResultsPage() {
  const params =
    useParams<{ gameId: string }>();

  const router = useRouter();

  const gameId = params.gameId;

  const [game, setGame] =
    useState<GameResult | null>(null);

  const [leaderboard, setLeaderboard] =
    useState<LeaderboardResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const [
          gameResponse,
          leaderboardResponse,
        ] = await Promise.all([
          fetch(`/api/game/${gameId}`, {
            cache: "no-store",
          }),

          fetch("/api/leaderboard", {
            cache: "no-store",
          }),
        ]);

        const gameResponseData =
          (await gameResponse.json()) as {
            success?: boolean;
            data?: GameResult;
            message?: string;
            error?: string;
          };

        const leaderboardData =
          (await leaderboardResponse.json()) as
            | LeaderboardResponse & {
                error?: string;
                message?: string;
              };

        if (!gameResponse.ok) {
          throw new Error(
            gameResponseData.message ||
              gameResponseData.error ||
              "Unable to load your game results.",
          );
        }

        const gameData =
          gameResponseData.data;

        if (!gameData) {
          throw new Error(
            "Game results were not returned.",
          );
        }

        if (!gameData.completed) {
          router.replace(
            `/play/${gameId}`,
          );
          return;
        }

        if (!leaderboardResponse.ok) {
          throw new Error(
            leaderboardData.message ||
              leaderboardData.error ||
              "Unable to load leaderboard.",
          );
        }

        if (!cancelled) {
          setGame(gameData);
          setLeaderboard(
            leaderboardData,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your game results.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [gameId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffaf6] text-[#121212] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
        <Navbar />

        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#6f7278] dark:text-[#b8aaa2]">
            <Loader2
              size={20}
              className="animate-spin text-[#FF6B00]"
            />
            Loading your results...
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="min-h-screen bg-[#fffaf6] text-[#121212] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
        <Navbar />

        <div className="mx-auto flex min-h-[70vh] max-w-[600px] items-center px-5 text-center">
          <div className="w-full rounded-[20px] border border-[#eadfd7] bg-white p-8 shadow-sm transition-colors dark:border-[#38271f] dark:bg-[#211712]">
            <p className="text-lg font-black text-[#451900] dark:text-[#fff4ec]">
              We couldn't load your results.
            </p>

            <p className="mt-2 text-sm leading-6 text-[#6f7278] dark:text-[#b8aaa2]">
              {error ||
                "Something went wrong."}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#e85f00]"
            >
              Try Again
            </button>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  const accuracy =
    game.totalQuestions > 0
      ? Math.round(
          (game.correctAnswers /
            game.totalQuestions) *
            100,
        )
      : 0;

  const resultMessage =
    getResultMessage(
      game.correctAnswers,
      game.totalQuestions,
    );

  const currentUser =
    leaderboard?.currentUser ?? null;

  const weeklyPlayers =
    leaderboard?.weekly?.slice(0, 3) ?? [];

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#121212] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      {/* RESULTS HERO */}
      <section className="relative overflow-hidden px-5 pb-12 pt-14 sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[#ffe8d4] opacity-60 blur-3xl dark:bg-[#542b17] dark:opacity-40" />

        <div className="relative mx-auto max-w-[760px] text-center">
          <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#FF6B00] shadow-[0_14px_35px_rgba(255,107,0,0.22)]">
            <Trophy
              size={34}
              strokeWidth={2.2}
              className="text-white"
            />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B00]">
            ROUND COMPLETE
          </p>

          <h1 className="mt-3 text-[42px] font-black leading-[0.98] tracking-[-0.055em] text-[#451900] dark:text-[#fff4ec] sm:text-[58px]">
            {game.correctAnswers} out of{" "}
            {game.totalQuestions}
          </h1>

          <p className="mt-4 text-lg font-bold text-[#451900] dark:text-[#ffe9dc]">
            {resultMessage}
          </p>

          <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-[#6f7278] dark:text-[#b8aaa2]">
            You answered{" "}
            {game.questionsAnswered}{" "}
            {game.questionsAnswered === 1
              ? "question"
              : "questions"}{" "}
            and earned{" "}
            {formatPoints(game.score)}{" "}
            {game.score === 1
              ? "point"
              : "points"}.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="px-5 pb-10 sm:px-8">
        <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-[#eadfd7] bg-white px-5 py-6 text-center shadow-[0_8px_25px_rgba(69,25,0,0.04)] transition-colors dark:border-[#38271f] dark:bg-[#211712] dark:shadow-[0_8px_25px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f7278] dark:text-[#9f9189]">
              POINTS
            </p>

            <p className="mt-2 text-3xl font-black text-[#451900] dark:text-[#fff4ec]">
              {formatPoints(game.score)}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#eadfd7] bg-white px-5 py-6 text-center shadow-[0_8px_25px_rgba(69,25,0,0.04)] transition-colors dark:border-[#38271f] dark:bg-[#211712] dark:shadow-[0_8px_25px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f7278] dark:text-[#9f9189]">
              CORRECT
            </p>

            <p className="mt-2 text-3xl font-black text-[#451900] dark:text-[#fff4ec]">
              {game.correctAnswers}
            </p>
          </div>

          <div className="rounded-[18px] border border-[#eadfd7] bg-white px-5 py-6 text-center shadow-[0_8px_25px_rgba(69,25,0,0.04)] transition-colors dark:border-[#38271f] dark:bg-[#211712] dark:shadow-[0_8px_25px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f7278] dark:text-[#9f9189]">
              ACCURACY
            </p>

            <p className="mt-2 text-3xl font-black text-[#451900] dark:text-[#fff4ec]">
              {accuracy}%
            </p>
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <section className="px-5 pb-14 sm:px-8">
        <div className="mx-auto flex max-w-[760px] flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() =>
              router.push("/play")
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(255,107,0,0.18)] transition hover:bg-[#e85f00]"
          >
            <RotateCcw size={16} />
            Play Again
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/leaderboard")
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9ccc4] bg-white px-7 py-3.5 text-sm font-bold text-[#451900] transition hover:border-[#FF6B00] hover:text-[#FF6B00] dark:border-[#4a3429] dark:bg-[#211712] dark:text-[#ffe9dc] dark:hover:border-[#FF6B00] dark:hover:text-[#FF6B00]"
          >
            View Leaderboard
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* CURRENT POSITION */}
      {currentUser && (
        <section className="border-y border-[#eadfd7] bg-[#ffe8d4] px-5 py-10 transition-colors dark:border-[#4a3022] dark:bg-[#302017] sm:px-8">
          <div className="mx-auto max-w-[760px]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6f7278] dark:text-[#a99a92]">
                  YOUR CURRENT POSITION
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
                  #{currentUser.rank}
                </p>

                <p className="mt-1 text-sm text-[#6f7278] dark:text-[#b8aaa2]">
                  {currentUser.username}
                </p>
              </div>

              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-[#6f7278] dark:text-[#a99a92]">
                    Lifetime Points
                  </p>

                  <p className="mt-1 text-lg font-black text-[#451900] dark:text-[#fff4ec]">
                    {formatPoints(
                      currentUser.totalPoints,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#6f7278] dark:text-[#a99a92]">
                    Streak
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-lg font-black text-[#451900] dark:text-[#fff4ec]">
                    <Flame
                      size={16}
                      fill="#FF6B00"
                      className="text-[#FF6B00]"
                    />

                    {game.currentStreak ??
                      currentUser.dailyStreak}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WEEKLY */}
      <section className="px-5 pb-20 pt-14 sm:px-8">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6B00]">
              KEEP CLIMBING
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec]">
              Top Players This Week
            </h2>

            <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-[#6f7278] dark:text-[#b8aaa2]">
              See who&apos;s leading the
              week after your round.
            </p>
          </div>

          {weeklyPlayers.length > 0 ? (
            <div className="mt-8 overflow-hidden rounded-[20px] border border-[#eadfd7] bg-white shadow-[0_10px_30px_rgba(69,25,0,0.05)] transition-colors dark:border-[#38271f] dark:bg-[#211712] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
              {weeklyPlayers.map(
                (player) => (
                  <WeeklyPlayer
                    key={player.id}
                    player={player}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-[20px] border border-[#eadfd7] bg-white p-9 text-center transition-colors dark:border-[#38271f] dark:bg-[#211712]">
              <Medal
                size={30}
                className="mx-auto text-[#FF6B00]"
              />

              <p className="mt-3 text-sm font-bold text-[#451900] dark:text-[#fff4ec]">
                You&apos;re among the
                first players this week.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
