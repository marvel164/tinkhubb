"use client";

import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Loader2,
  Medal,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

type LeaderboardPlayer = {
  rank: number;
  id: string;
  username: string;
  totalPoints: number;
  dailyStreak: number;
};

type LeaderboardResponse = {
  weekly: LeaderboardPlayer[];
  global: LeaderboardPlayer[];
  currentUser: LeaderboardPlayer | null;
  totalPlayers: number;
  updatedAt: string;
  error?: string;
};

function formatPoints(points: number) {
  return points.toLocaleString();
}

function PodiumCard({
  player,
  position,
}: {
  player: LeaderboardPlayer;
  position: 1 | 2 | 3;
}) {
  const isFirst = position === 1;
  const isSecond = position === 2;

  return (
    <div
      className={`relative flex flex-col items-center rounded-[18px] border px-5 pb-7 pt-8 text-center transition-all duration-200 hover:-translate-y-1 ${
        isFirst
          ? "border-[#FF6B00]/30 bg-[#fff8f2] shadow-[0_16px_40px_rgba(255,107,0,0.10)] md:-translate-y-5 md:hover:-translate-y-6 dark:border-[#FF6B00]/30 dark:bg-[#2a1d17] dark:shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
          : "border-[#eadfd7] bg-white shadow-[0_12px_35px_rgba(69,25,0,0.045)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_12px_35px_rgba(0,0,0,0.16)]"
      }`}
    >
      {isFirst && (
        <div className="absolute -top-4 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B00] px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_8px_20px_rgba(255,107,0,0.2)]">
          <Trophy size={12} />
          Top Player
        </div>
      )}

      <div
        className={`flex h-[64px] w-[64px] items-center justify-center rounded-full text-lg font-black ${
          isFirst
            ? "bg-[#FF6B00] text-white"
            : isSecond
              ? "bg-[#fff0e6] text-[#FF6B00] dark:bg-[#38251c] dark:text-[#ff9b5a]"
              : "bg-[#f5eee9] text-[#451900] dark:bg-[#30241f] dark:text-[#eee3dd]"
        }`}
      >
        {position}
      </div>

      <p className="mt-4 max-w-full truncate text-sm font-extrabold text-[#451900] dark:text-[#fff4ec]">
        {player.username}
      </p>

      <p className="mt-1 text-xs text-[#6f7278] dark:text-[#b9aaa2]">
        {formatPoints(player.totalPoints)} points
      </p>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#fffaf6] px-3 py-1.5 text-[10px] font-bold text-[#6f7278] dark:bg-[#1d1512] dark:text-[#b9aaa2]">
        <Flame
          size={13}
          className="text-[#FF6B00]"
          fill="#FF6B00"
        />
        {player.dailyStreak} day streak
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [data, setData] =
    useState<LeaderboardResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadLeaderboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/leaderboard",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as LeaderboardResponse;

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Unable to load leaderboard.",
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load leaderboard.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadLeaderboard();

    const interval =
      window.setInterval(() => {
        loadLeaderboard(true);
      }, 30000);

    return () =>
      window.clearInterval(interval);
  }, [loadLeaderboard]);

  const weeklyPlayers =
    data?.weekly ?? [];

  const globalPlayers =
    data?.global ?? [];

  const currentUser =
    data?.currentUser ?? null;

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pb-14 pt-14 sm:px-8 sm:pb-16 sm:pt-18 md:pb-20 md:pt-20">
        <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[#ffe8d4] opacity-60 blur-3xl dark:bg-[#4a2818] dark:opacity-40" />

        <div className="relative mx-auto max-w-[1040px] text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#FF6B00] sm:text-xs">
            LEADERBOARD
          </p>

          <h1 className="mx-auto mt-4 max-w-[760px] text-[40px] font-black leading-[1] tracking-[-0.055em] text-[#451900] dark:text-[#fff4ec] sm:text-[52px] md:text-[62px]">
            See exactly where you stand.
          </h1>

          <p className="mx-auto mt-5 max-w-[570px] text-xs leading-6 text-[#6f7278] dark:text-[#b9aaa2] sm:text-sm sm:leading-7">
            Every correct answer moves you
            closer to the top. Keep playing,
            keep your streak alive, and see
            how you stack up.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {data && (
              <span className="text-[10px] text-[#8b776c] dark:text-[#9e8c83] sm:text-xs">
                {data.totalPlayers} active{" "}
                {data.totalPlayers === 1
                  ? "player"
                  : "players"}
              </span>
            )}

            <span className="h-1 w-1 rounded-full bg-[#cdbeb5] dark:bg-[#5a4840]" />

            <button
              type="button"
              onClick={() =>
                loadLeaderboard(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold text-[#451900] transition hover:bg-[#fff0e6] hover:text-[#FF6B00] disabled:opacity-50 dark:text-[#eee3dd] dark:hover:bg-[#2a1e19] dark:hover:text-[#FF6B00] sm:text-xs"
            >
              <RefreshCw
                size={13}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="border-t border-[#f1e5dc] bg-[#fffaf6] px-5 pb-20 pt-2 dark:border-[#342620] dark:bg-[#17110e] sm:px-8 md:pb-24">
        <div className="mx-auto max-w-[1040px]">
          {/* LOADING */}
          {loading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex items-center gap-3 text-xs font-semibold text-[#6f7278] dark:text-[#a99b93]">
                <Loader2
                  size={19}
                  className="animate-spin text-[#FF6B00]"
                />
                Loading leaderboard...
              </div>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="mx-auto mt-10 max-w-[600px] rounded-[18px] border border-[#ffd7c0] bg-white p-8 text-center shadow-[0_10px_30px_rgba(69,25,0,0.04)] dark:border-[#5a3525] dark:bg-[#241b17]">
              <p className="text-sm font-extrabold text-[#451900] dark:text-[#fff4ec]">
                We couldn't load the leaderboard.
              </p>

              <p className="mt-2 text-xs leading-6 text-[#6f7278] dark:text-[#b9aaa2]">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadLeaderboard()
                }
                className="mt-5 rounded-[8px] bg-[#FF6B00] px-6 py-3 text-xs font-extrabold text-white transition hover:bg-[#e95f00]"
              >
                Try Again
              </button>
            </div>
          )}

          {/* DATA */}
          {!loading && !error && data && (
            <>
              {/* CURRENT USER */}
              {currentUser && (
                <div className="mt-9 flex flex-col gap-5 rounded-[18px] border border-[#ffd8bd] bg-[#ffe8d4] p-5 transition-colors dark:border-[#63412e] dark:bg-[#302119] sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#765646] dark:text-[#cdb8aa]">
                      YOUR POSITION
                    </p>

                    <p className="mt-1.5 text-lg font-black text-[#451900] dark:text-[#fff4ec]">
                      #{currentUser.rank}
                      <span className="ml-2 font-semibold">
                        {currentUser.username}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-7">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8b776c] dark:text-[#9e8c83]">
                        Points
                      </p>

                      <p className="mt-1 text-base font-black text-[#451900] dark:text-[#fff4ec]">
                        {formatPoints(
                          currentUser.totalPoints,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8b776c] dark:text-[#9e8c83]">
                        Streak
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-base font-black text-[#451900] dark:text-[#fff4ec]">
                        <Flame
                          size={15}
                          fill="#FF6B00"
                          className="text-[#FF6B00]"
                        />
                        {currentUser.dailyStreak}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* WEEKLY */}
              <section className="mt-14">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF6B00]">
                      THIS WEEK
                    </p>

                    <h2 className="mt-2 text-[28px] font-black tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec] sm:text-3xl">
                      Top Players This Week
                    </h2>
                  </div>

                  <p className="text-[10px] text-[#8b776c] dark:text-[#9e8c83] sm:text-xs">
                    Fresh rankings. Updated automatically.
                  </p>
                </div>

                {weeklyPlayers.length === 0 ? (
                  <div className="mt-8 rounded-[18px] border border-[#eadfd7] bg-white p-10 text-center dark:border-[#49352c] dark:bg-[#241b17]">
                    <Medal
                      size={30}
                      className="mx-auto text-[#FF6B00]"
                    />

                    <p className="mt-4 text-sm font-extrabold text-[#451900] dark:text-[#fff4ec]">
                      No games completed this
                      week yet.
                    </p>

                    <p className="mt-2 text-xs text-[#6f7278] dark:text-[#a99b93]">
                      Be the first player to
                      make the leaderboard.
                    </p>
                  </div>
                ) : (
                  <div className="mt-11 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-end">
                    {weeklyPlayers
                      .slice(0, 3)
                      .map((player) => (
                        <PodiumCard
                          key={player.id}
                          player={player}
                          position={
                            player.rank as
                              | 1
                              | 2
                              | 3
                          }
                        />
                      ))}
                  </div>
                )}
              </section>

              {/* GLOBAL */}
              <section className="mt-20">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF6B00]">
                      ALL TIME
                    </p>

                    <h2 className="mt-2 text-[28px] font-black tracking-[-0.045em] text-[#451900] dark:text-[#fff4ec] sm:text-3xl">
                      Global Leaderboard
                    </h2>
                  </div>

                  <p className="text-[10px] text-[#8b776c] dark:text-[#9e8c83] sm:text-xs">
                    Higher total points rank higher.
                  </p>
                </div>

                <div className="mt-7 overflow-hidden rounded-[18px] border border-[#eadfd7] bg-white shadow-[0_10px_30px_rgba(69,25,0,0.04)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
                  {/* DESKTOP HEADER */}
                  <div className="hidden grid-cols-[80px_1fr_160px_140px] border-b border-[#eee5df] bg-[#fffaf6] px-6 py-4 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8b776c] dark:border-[#49352c] dark:bg-[#211713] dark:text-[#a99b93] sm:grid">
                    <span>Rank</span>
                    <span>Username</span>
                    <span className="text-right">
                      Total Points
                    </span>
                    <span className="text-right">
                      Daily Streak
                    </span>
                  </div>

                  {globalPlayers.length === 0 ? (
                    <div className="p-10 text-center text-xs text-[#6f7278] dark:text-[#a99b93]">
                      No players found.
                    </div>
                  ) : (
                    globalPlayers.map(
                      (player) => {
                        const isCurrent =
                          currentUser?.id ===
                          player.id;

                        return (
                          <div
                            key={player.id}
                            className={`grid grid-cols-[45px_1fr_auto] items-center gap-3 border-b border-[#f1eae5] px-4 py-4 transition-colors last:border-b-0 sm:grid-cols-[80px_1fr_160px_140px] sm:px-6 sm:py-5 ${
                              isCurrent
                                ? "bg-[#fff4eb] dark:bg-[#302119]"
                                : "bg-white hover:bg-[#fffaf6] dark:bg-[#241b17] dark:hover:bg-[#2a1e19]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-black ${
                                  player.rank <= 3
                                    ? "text-[#FF6B00]"
                                    : "text-[#451900] dark:text-[#fff4ec]"
                                }`}
                              >
                                {player.rank}
                              </span>

                              {player.rank ===
                                1 && (
                                <Trophy
                                  size={13}
                                  className="hidden text-[#FF6B00] sm:block"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-extrabold text-[#451900] dark:text-[#fff4ec] sm:text-sm">
                                {player.username}
                              </p>

                              {isCurrent && (
                                <span className="mt-1 inline-flex text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#FF6B00]">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-black text-[#451900] dark:text-[#fff4ec] sm:text-sm">
                                {formatPoints(
                                  player.totalPoints,
                                )}
                              </p>

                              <p className="text-[8px] text-[#8b776c] dark:text-[#9e8c83] sm:hidden">
                                points
                              </p>
                            </div>

                            <div className="hidden items-center justify-end gap-1.5 text-xs font-bold text-[#451900] dark:text-[#fff4ec] sm:flex">
                              <Flame
                                size={13}
                                fill="#FF6B00"
                                className="text-[#FF6B00]"
                              />
                              {player.dailyStreak}
                            </div>
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </section>

              {/* CTA */}
              <section className="mt-16 overflow-hidden rounded-[18px] bg-[#451900] px-6 py-11 text-center dark:bg-[#24130c] sm:px-10">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#ffb47f]">
                  KEEP CLIMBING
                </p>

                <h2 className="mx-auto mt-3 max-w-[600px] text-[25px] font-black tracking-[-0.04em] text-white sm:text-3xl">
                  Your next correct answer
                  could change everything.
                </h2>

                <Link
                  href="/play"
                  className="mt-7 inline-flex items-center gap-2 rounded-[8px] bg-[#FF6B00] px-7 py-3.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(255,107,0,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#e95f00]"
                >
                  Play Now
                  <ArrowRight size={14} />
                </Link>
              </section>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
