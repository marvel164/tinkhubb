"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Flame,
  Loader2,
  Shuffle,
  Trophy,
} from "lucide-react";
import AdminShell from "@/components/admin/admin-shell";

type Player = {
  id: string;
  username: string;
  totalPoints: number;
  currentStreak: number;
  selected?: boolean;
};

type RankedPlayer = Player & {
  rank: number;
};

type WinnerData = {
  campaign: {
    id: string;
    name: string;
    month: string;
    leaderboardSlots: number;
    raffleSlots: number;
    requiredStreak: number;
    raffleDrawn: boolean;
  };

  top30: RankedPlayer[];

  rafflePool: Player[];

  eligibleCount: number;
  raffleWinnerCount: number;
};

export default function WinnersClient({
  adminName,
  adminEmail,
  adminRole,
}: {
  adminName: string;
  adminEmail: string;
  adminRole: string;
}) {
  const [data, setData] = useState<WinnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/winners",
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to load winner selection.",
        );
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load winner selection.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function runRaffle() {
    if (!data || data.campaign.raffleDrawn) {
      return;
    }

    const confirmed = window.confirm(
      `Run the ${data.campaign.raffleSlots}-slot raffle for ${data.campaign.month}? This selection will be recorded and cannot be redrawn for this campaign.`,
    );

    if (!confirmed) {
      return;
    }

    setDrawing(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/winners",
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to run raffle draw.",
        );
      }

      setMessage(result.message);

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run raffle draw.",
      );
    } finally {
      setDrawing(false);
    }
  }

  return (
    <AdminShell
      adminName={adminName}
      adminEmail={adminEmail}
      adminRole={adminRole}
      active="winners"
    >
      <main className="min-h-[calc(100vh-76px)] bg-[#f5f6f8] px-4 py-7 text-[#171717] md:px-7 md:py-8 dark:bg-[#15120f] dark:text-[#fff4ec]">
        <div className="mx-auto max-w-[1280px]">

          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.03em]">
              Winners Selection
            </h1>

            <p className="mt-1 text-[11px] text-[#777b80] dark:text-[#a99d96]">
              Configure and run the monthly winner selection.
            </p>
          </div>

          {loading ? (
            <div className="mt-7 flex min-h-[420px] items-center justify-center rounded-[6px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
              <Loader2
                className="animate-spin text-[#ff6b00]"
                size={22}
              />
            </div>
          ) : error && !data ? (
            <div className="mt-7 rounded-[6px] border border-[#f1c7c7] bg-white px-5 py-4 text-sm text-[#b42318] dark:border-[#5a3028] dark:bg-[#1b1714] dark:text-[#ffb4a8]">
              {error}
            </div>
          ) : data ? (
            <>
              {message && (
                <div className="mt-6 flex items-center gap-2 rounded-[6px] border border-[#b9e2cc] bg-[#f0fff6] px-4 py-3 text-sm text-[#167044] dark:border-[#284c38] dark:bg-[#17251d] dark:text-[#8ce0ae]">
                  <CheckCircle2 size={17} />
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-[6px] border border-[#f1c7c7] bg-white px-4 py-3 text-sm text-[#b42318] dark:border-[#5a3028] dark:bg-[#1b1714] dark:text-[#ffb4a8]">
                  {error}
                </div>
              )}

              <section className="mt-7 overflow-hidden rounded-[6px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
                <div className="border-b border-[#eeeeef] px-5 py-5 dark:border-[#342a24]">
                  <h2 className="text-[15px] font-bold">
                    Monthly winner configuration
                  </h2>
                </div>

                <div className="grid grid-cols-1 divide-y divide-[#eeeeef] md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-[#342a24]">
                  <Summary
                    label="Selected by leaderboard rank"
                    value={data.campaign.leaderboardSlots}
                  />

                  <Summary
                    label="Selected by 30-day streak raffle"
                    value={data.campaign.raffleSlots}
                  />

                  <Summary
                    label="Raffle eligible winner"
                    value={data.eligibleCount}
                  />
                </div>
              </section>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_1fr]">

                <section className="overflow-hidden rounded-[6px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
                  <div className="border-b border-[#eeeeef] px-5 py-5 dark:border-[#342a24]">
                    <h2 className="text-[15px] font-bold">
                      Top 30 by rank
                    </h2>

                    <p className="mt-1 text-[11px] text-[#8a8d91] dark:text-[#9e9189]">
                      Automatic selection
                    </p>
                  </div>

                  <div className="px-5">
                    {data.top30.map((player) => (
                      <div
                        key={player.id}
                        className="grid grid-cols-[34px_1fr_auto_auto] items-center gap-3 border-b border-[#eeeeef] py-3.5 last:border-b-0 dark:border-[#342a24]"
                      >
                        <span className="text-[11px] font-semibold text-[#666a70] dark:text-[#a99d96]">
                          {String(player.rank).padStart(2, "0")}
                        </span>

                        <span className="truncate text-[12px] font-semibold">
                          {player.username}
                        </span>

                        <span className="text-[12px] font-medium tabular-nums">
                          {player.totalPoints.toLocaleString()} Points
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] text-[#777b80] dark:text-[#bdb0a8]">
                          <Flame
                            size={14}
                            className="text-[#ff6b00]"
                          />
                          {player.currentStreak}
                        </span>
                      </div>
                    ))}

                    {data.top30.length === 0 && (
                      <Empty text="No active players are currently ranked." />
                    )}
                  </div>
                </section>

                <section className="overflow-hidden rounded-[6px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
                  <div className="flex items-start justify-between gap-4 border-b border-[#eeeeef] px-5 py-5 dark:border-[#342a24]">

                    <div>
                      <h2 className="text-[15px] font-bold">
                        Raffle Pool
                      </h2>

                      <p className="mt-1 text-[11px] text-[#8a8d91] dark:text-[#9e9189]">
                        Eligible winners drawn at raffle
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={runRaffle}
                      disabled={
                        drawing ||
                        data.campaign.raffleDrawn ||
                        data.eligibleCount === 0
                      }
                      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[4px] bg-[#ff6b00] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#e85f00] disabled:opacity-50"
                    >
                      {drawing ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Shuffle size={14} />
                      )}

                      {data.campaign.raffleDrawn
                        ? "Raffle drawn"
                        : "Run raffle draw"}
                    </button>
                  </div>

                  <div className="px-5">
                    {data.rafflePool.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-3 border-b border-[#eeeeef] py-4 last:border-b-0 dark:border-[#342a24]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b00]" />

                          <span className="truncate text-[12px] font-semibold">
                            {player.username}
                          </span>

                          {player.selected && (
                            <Trophy
                              size={14}
                              className="shrink-0 text-[#ff6b00]"
                            />
                          )}
                        </div>

                        <span className="shrink-0 text-[12px] font-medium tabular-nums">
                          {player.totalPoints.toLocaleString()} Points
                        </span>
                      </div>
                    ))}

                    {data.rafflePool.length === 0 && (
                      <Empty text="No users currently meet the 30-day streak requirement." />
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </AdminShell>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="px-5 py-6">
      <p className="text-[28px] font-bold tracking-[-0.04em]">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-[#777b80] dark:text-[#a99d96]">
        {label}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-[150px] items-center justify-center py-8 text-center text-[11px] text-[#8a8d91] dark:text-[#9e9189]">
      {text}
    </div>
  );
}