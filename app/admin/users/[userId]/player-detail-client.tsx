"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Flame,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PlayerStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

type PlayerBadge = {
  earnedAt: string;
  type: string;
  name: string;
  description: string;
};

type RecentSession = {
  id: string;
  score: number;
  totalQuestions: number;
  completedAt: string | null;
  startedAt: string;
};

type Player = {
  id: string;
  username: string;
  phone: string;
  totalPoints: number;
  gamesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  longestStreak: number;
  status: PlayerStatus;
  createdAt: string;
  rank: number | null;
  badges: PlayerBadge[];
  recentSessions: RecentSession[];
};

const badgeDefinitions = [
  {
    type: "FIRST_GAME",
    name: "First Game Played",
  },
  {
    type: "QUESTIONS_50",
    name: "50 Questions Answered",
  },
  {
    type: "QUESTIONS_100",
    name: "100 Questions Answered",
  },
  {
    type: "STREAK_7",
    name: "7-day Streak",
  },
  {
    type: "STREAK_14",
    name: "14-day Streak",
  },
  {
    type: "STREAK_30",
    name: "30-day Streak",
  },
  {
    type: "STREAK_60",
    name: "60-day Streak",
  },
  {
    type: "STREAK_90",
    name: "90-day Streak",
  },
  {
    type: "TOP_10",
    name: "Top 10 Leaderboard",
  },
  {
    type: "PERFECT_ROUND",
    name: "Perfect Round",
  },
  {
    type: "CORRECT_500",
    name: "500 Correct Answers",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSessionDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PlayerStatus }) {
  const label =
    status === "ACTIVE"
      ? "Active"
      : status === "SUSPENDED"
        ? "Suspended"
        : "Deleted";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
        status === "ACTIVE"
          ? "bg-[#e9f8f0] text-[#168052] dark:bg-[#153526] dark:text-[#66d9a0]"
          : status === "SUSPENDED"
            ? "bg-[#fff0f3] text-[#d33a57] dark:bg-[#3b2028] dark:text-[#ff8098]"
            : "bg-[#f0f1f2] text-[#73777d] dark:bg-[#2b2927] dark:text-[#aaa19c]",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          status === "ACTIVE"
            ? "bg-[#26b97a]"
            : status === "SUSPENDED"
              ? "bg-[#e44d6c]"
              : "bg-[#96999d]",
        ].join(" ")}
      />
      {label}
    </span>
  );
}

export default function PlayerDetailClient({ player }: { player: Player }) {
  const [action, setAction] = useState<"SUSPEND" | "REACTIVATE" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showBadges, setShowBadges] = useState(false);

  const accuracy = useMemo(() => {
    if (player.questionsAnswered === 0) {
      return 0;
    }

    return Math.round((player.correctAnswers / player.questionsAnswered) * 100);
  }, [player.correctAnswers, player.questionsAnswered]);

  const unlockedBadgeTypes = new Set(player.badges.map((badge) => badge.type));

  const displayBadges = badgeDefinitions.map((badge) => ({
    ...badge,
    unlocked: unlockedBadgeTypes.has(badge.type),
  }));

  const unlockedBadges = displayBadges.filter((badge) => badge.unlocked);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedAction = params.get("action");

    if (requestedAction === "suspend" && player.status === "ACTIVE") {
      setAction("SUSPEND");
    }

    if (requestedAction === "reactivate" && player.status === "SUSPENDED") {
      setAction("REACTIVATE");
    }
  }, [player.status]);

  async function executeAction() {
    if (!action) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${player.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update player.");
      }

      window.location.href = "/admin/users";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update player.");
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#f5f6fa] px-4 py-7 text-[#171717] dark:bg-[#151210] dark:text-[#fff4ec] md:px-7 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-[10px] font-medium text-[#45484d] hover:text-[#ff6b00] dark:text-[#bdb3ad]"
        >
          <ArrowLeft size={14} />
          Back to Players
        </Link>

        <section className="mt-6 flex flex-col gap-5 rounded-[7px] bg-[#e9ebef] p-5 dark:bg-[#241e1a] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff0e5] text-[#ff6b00] dark:bg-[#3a2419]">
              <Trophy size={21} strokeWidth={1.7} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[14px] font-bold">{player.username}</h1>

                <span className="text-[10px] text-[#73777d] dark:text-[#aaa19c]">
                  Phone Number · {player.phone}
                </span>
              </div>

              <div className="mt-2">
                <StatusBadge status={player.status} />
              </div>
            </div>
          </div>

          {player.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => setAction("SUSPEND")}
              className="h-10 rounded-[4px] border border-[#efbfc7] bg-[#ffe8ec] px-6 text-[10px] font-semibold text-[#d43c58] hover:bg-[#ffdde3] dark:border-[#5a2931] dark:bg-[#382027] dark:text-[#ff8299]"
            >
              Suspend Player
            </button>
          )}

          {player.status === "SUSPENDED" && (
            <button
              type="button"
              onClick={() => setAction("REACTIVATE")}
              className="h-10 rounded-[4px] bg-[#ff6b00] px-6 text-[10px] font-semibold text-white hover:bg-[#e96000]"
            >
              Reactivate Player
            </button>
          )}
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            value={player.rank ? `#${player.rank}` : "—"}
            label="Leaderboard Rank"
          />

          <MetricCard
            value={player.totalPoints.toLocaleString("en-NG")}
            label="Total Points"
          />

          <MetricCard
            value={
              <span className="inline-flex items-center gap-1.5">
                <Flame size={17} className="text-[#ff6b00]" />
                {player.currentStreak}
              </span>
            }
            label="Current Streak"
          />

          <MetricCard value={player.longestStreak} label="Longest Streak" />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[7px] bg-[#e9ebef] p-5 dark:bg-[#241e1a]">
            <h2 className="text-[14px] font-bold">Player&apos;s History</h2>

            <p className="mt-1 text-[10px] text-[#73777d] dark:text-[#aaa19c]">
              Performance summary
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryItem label="Games Played" value={player.gamesPlayed} />

              <SummaryItem
                label="Questions Answered"
                value={player.questionsAnswered.toLocaleString("en-NG")}
              />

              <SummaryItem
                label="Correct Answers"
                value={player.correctAnswers.toLocaleString("en-NG")}
              />

              <SummaryItem label="Accuracy Rate" value={`${accuracy}%`} />
            </div>
          </section>

          <section className="rounded-[7px] bg-[#e9ebef] p-5 dark:bg-[#241e1a]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[14px] font-bold">Achievement Badges</h2>

                <p className="mt-1 text-[10px] text-[#73777d] dark:text-[#aaa19c]">
                  {unlockedBadges.length} unlocked
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBadges(true)}
                className="text-[10px] font-semibold text-[#55585d] hover:text-[#ff6b00] dark:text-[#c5bbb4]"
              >
                See all
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {unlockedBadges.slice(0, 4).map((badge) => (
                <div
                  key={badge.type}
                  className="rounded-[5px] bg-[#dfe1e5] px-3 py-3 text-[10px] font-medium dark:bg-[#302925]"
                >
                  {badge.name}
                </div>
              ))}

              {unlockedBadges.length === 0 && (
                <div className="col-span-2 rounded-[5px] bg-[#dfe1e5] px-3 py-4 text-center text-[10px] text-[#777b80] dark:bg-[#302925] dark:text-[#aaa19c]">
                  No badges unlocked yet.
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="mt-4 rounded-[7px] bg-[#e9ebef] p-5 dark:bg-[#241e1a]">
          <h2 className="text-[14px] font-bold">Recent Sessions</h2>

          <p className="mt-1 text-[10px] text-[#73777d] dark:text-[#aaa19c]">
            Most recent completed quiz sessions
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse">
              <thead>
                <tr className="border-b border-[#d5d8dc] text-left dark:border-[#3a322d]">
                  <th className="px-3 pb-3 text-[9px] font-bold text-[#73777d] dark:text-[#9f958e]">
                    DATE
                  </th>

                  <th className="px-3 pb-3 text-[9px] font-bold text-[#73777d] dark:text-[#9f958e]">
                    SCORE
                  </th>

                  <th className="px-3 pb-3 text-right text-[9px] font-bold text-[#73777d] dark:text-[#9f958e]">
                    POINTS EARNED
                  </th>
                </tr>
              </thead>

              <tbody>
                {player.recentSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-10 text-center text-[10px] text-[#777b80] dark:text-[#aaa19c]"
                    >
                      No completed sessions yet.
                    </td>
                  </tr>
                ) : (
                  player.recentSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-[#dfe1e4] last:border-b-0 dark:border-[#332b27]"
                    >
                      <td className="px-3 py-3.5 text-[10px]">
                        {formatSessionDate(session.completedAt)}
                      </td>

                      <td className="px-3 py-3.5 text-[10px] font-medium">
                        {session.score}/{session.totalQuestions}
                      </td>

                      <td className="px-3 py-3.5 text-right text-[10px] font-semibold">
                        +{session.score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-4 text-right text-[9px] text-[#92959a] dark:text-[#817770]">
          Joined {formatDate(player.createdAt)}
        </p>
      </div>

      {showBadges && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          onClick={() => setShowBadges(false)}
        >
          <div
            className="w-full max-w-[385px] rounded-[7px] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)] dark:bg-[#211b18]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[16px] font-bold">Achievement Badges</h2>

                <p className="mt-1 text-[10px] text-[#73777d] dark:text-[#aaa19c]">
                  {unlockedBadges.length} unlocked
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBadges(false)}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#777b80] hover:bg-[#f3f3f4] dark:hover:bg-[#2b2420]"
                aria-label="Close badges"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {displayBadges.map((badge) => (
                <div
                  key={badge.type}
                  className={[
                    "rounded-[5px] px-3 py-3 text-[10px] font-medium",
                    badge.unlocked
                      ? "bg-[#e9ebef] text-[#303237] dark:bg-[#302925] dark:text-[#eee5df]"
                      : "bg-[#f5f5f6] text-[#a4a6aa] dark:bg-[#27211e] dark:text-[#706760]",
                  ].join(" ")}
                >
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {action && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          onClick={() => {
            if (!processing) {
              setAction(null);
            }
          }}
        >
          <div
            className="w-full max-w-[500px] rounded-[8px] bg-white px-7 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.25)] dark:bg-[#211b18]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-center">
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[18px] bg-[#ffe3e7] text-[#df3d5d] dark:bg-[#412027] dark:text-[#ff8299]">
                <ShieldOff size={34} strokeWidth={1.7} />
              </div>
            </div>

            <h2 className="mt-6 text-center text-[20px] font-bold">
              {action === "SUSPEND" ? "Suspend Player?" : "Reactivate Player?"}
            </h2>

            <p className="mx-auto mt-3 max-w-[350px] text-center text-[11px] leading-6 text-[#777b80] dark:text-[#aaa19c]">
              {action === "SUSPEND"
                ? `Are you sure you want to suspend ${player.username}? The player loses access to play on Tinkhupp.`
                : `Are you sure you want to reactivate ${player.username}? The player will regain access to play on Tinkhupp.`}
            </p>

            {error && (
              <div className="mt-4 rounded-[5px] border border-[#efcaca] bg-[#fff5f5] p-3 text-center text-[10px] text-[#b42318] dark:border-[#51252a] dark:bg-[#30191b] dark:text-[#ff929b]">
                {error}
              </div>
            )}

            <div className="mt-7 flex justify-center gap-2.5">
              <button
                type="button"
                disabled={processing}
                onClick={() => setAction(null)}
                className="h-10 min-w-[125px] rounded-[4px] border border-[#e0e1e3] bg-white text-[10px] font-semibold text-[#777b80] hover:bg-[#f7f7f7] dark:border-[#423831] dark:bg-[#211b18] dark:text-[#c7bdb6] dark:hover:bg-[#2a211d]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => void executeAction()}
                className="inline-flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-[4px] bg-[#ff6b00] px-5 text-[10px] font-semibold text-white hover:bg-[#e96000] disabled:opacity-60"
              >
                {processing && <Loader2 size={14} className="animate-spin" />}

                {action === "SUSPEND"
                  ? "Yes, suspend player"
                  : "Yes, reactivate player"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-[7px] bg-[#e9ebef] px-5 py-5 dark:bg-[#241e1a]">
      <p className="text-[22px] font-bold tracking-[-0.03em]">{value}</p>
      <p className="mt-2 text-[10px] text-[#73777d] dark:text-[#aaa19c]">
        {label}
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-[5px] bg-[#dfe1e5] px-3 py-3 dark:bg-[#302925]">
      <span className="text-[10px] text-[#73777d] dark:text-[#aaa19c]">
        {label}
      </span>

      <strong className="text-[10px] font-bold">{value}</strong>
    </div>
  );
}
