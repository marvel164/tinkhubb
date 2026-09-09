"use client";

import {
  AlertTriangle,
  Clock3,
  Download,
  History,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type PlayerStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

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
};

type SortOption =
  | "AZ"
  | "ZA"
  | "JOINED_ASC"
  | "JOINED_DESC"
  | "POINTS_DESC"
  | "STREAK_DESC";

type StatusFilter = "ALL" | PlayerStatus;

type BulkAction = "SUSPEND" | "REACTIVATE" | "DELETE";

type PlayerStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
};

type MenuPosition = {
  top: number;
  left: number;
};

type GameHistory = {
  id: string;
  status: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAnswered: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
};

type HistoryPlayer = {
  id: string;
  username: string;
  phone: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds < 0) {
    return "—";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function calculateAccuracy(player: Player) {
  if (player.questionsAnswered === 0) {
    return 0;
  }

  return Math.round((player.correctAnswers / player.questionsAnswered) * 100);
}

export default function PlayerManagementPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<PlayerStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortOption>("AZ");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const [actionPlayer, setActionPlayer] = useState<Player | null>(null);
  const [individualAction, setIndividualAction] = useState<BulkAction | null>(
    null,
  );
  const [actionProcessing, setActionProcessing] = useState(false);

  const [historyPlayer, setHistoryPlayer] = useState<HistoryPlayer | null>(
    null,
  );
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  async function loadPlayers() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      params.set("sort", sort);

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load players.");
      }

      /*
       * IMPORTANT:
       * The admin users API returns `users`, not `players`.
       */
      setPlayers(data.users ?? []);

      setStats(
        data.stats ?? {
          totalUsers: 0,
          activeUsers: 0,
          suspendedUsers: 0,
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load players.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPlayers();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, statusFilter, sort]);

  useEffect(() => {
    function handleOutsideClick() {
      setOpenMenuId(null);
      setMenuPosition(null);
    }

    if (!openMenuId) {
      return;
    }

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [openMenuId]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenuId(null);
      setMenuPosition(null);
      setHistoryPlayer(null);
      setActionPlayer(null);
      setBulkAction(null);
      setIndividualAction(null);
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function togglePlayer(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleAllPlayers() {
    if (selectedIds.length === players.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(players.map((player) => player.id));
  }

  function openPlayerMenu(
    event: React.MouseEvent<HTMLButtonElement>,
    playerId: string,
  ) {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    setOpenMenuId(playerId);
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(16, rect.right - 210),
    });
  }

  async function openHistory(player: Player) {
    setOpenMenuId(null);
    setMenuPosition(null);

    setHistoryPlayer({
      id: player.id,
      username: player.username,
      phone: player.phone,
    });

    setHistoryLoading(true);
    setHistoryError("");
    setGameHistory([]);

    try {
      const response = await fetch(`/api/admin/users/${player.id}/history`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load player history.");
      }

      setGameHistory(data.games ?? []);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Unable to load player history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistoryPlayer(null);
    setGameHistory([]);
    setHistoryError("");
  }

  function openIndividualAction(player: Player, action: BulkAction) {
    setOpenMenuId(null);
    setMenuPosition(null);
    setActionPlayer(player);
    setIndividualAction(action);
  }

  async function executeIndividualAction() {
    if (!actionPlayer || !individualAction) {
      return;
    }

    setActionProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/users/${actionPlayer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: individualAction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update player.");
      }

      setSuccess(
        individualAction === "SUSPEND"
          ? `${actionPlayer.username} has been suspended.`
          : individualAction === "REACTIVATE"
            ? `${actionPlayer.username} has been reactivated.`
            : `${actionPlayer.username} has been deleted.`,
      );

      setActionPlayer(null);
      setIndividualAction(null);
      setSelectedIds([]);

      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update player.");
    } finally {
      setActionProcessing(false);
    }
  }

  async function executeBulkAction() {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    setBulkProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedIds,
          action: bulkAction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to complete bulk action.");
      }

      setSuccess(
        bulkAction === "SUSPEND"
          ? `${selectedIds.length} player(s) suspended successfully.`
          : bulkAction === "REACTIVATE"
            ? `${selectedIds.length} player(s) reactivated successfully.`
            : `${selectedIds.length} player(s) deleted successfully.`,
      );

      setSelectedIds([]);
      setBulkAction(null);

      await loadPlayers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete bulk action.",
      );
    } finally {
      setBulkProcessing(false);
    }
  }

  function getBulkLabel(action: BulkAction) {
    if (action === "SUSPEND") {
      return "Suspend";
    }

    if (action === "REACTIVATE") {
      return "Reactivate";
    }

    return "Mass Delete";
  }

  async function exportLeaderboard() {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users/leaderboard-export", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message || "Unable to export leaderboard.");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `tinkhubb-leaderboard-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setSuccess("Leaderboard exported successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to export leaderboard.",
      );
    }
  }

  const allSelected =
    players.length > 0 && selectedIds.length === players.length;

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#121212]">
      <header className="flex min-h-[72px] items-center justify-between border-b border-[#e8e8e8] bg-white px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff6b00]">
            TinkHubb Admin
          </p>

          <h1 className="mt-1 text-[22px] font-bold tracking-[-0.02em]">
            Player Management
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void exportLeaderboard()}
          className="inline-flex h-10 items-center gap-2 rounded-[5px] bg-[#ff6b00] px-4 text-sm font-semibold text-white transition hover:bg-[#e85f00]"
        >
          <Download size={16} />
          Leaderboard Export
        </button>
      </header>

      <main className="px-8 py-7">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[8px] border border-[#e9e9e9] bg-white p-5">
            <p className="text-sm text-[#6f7278]">Total Players</p>

            <p className="mt-2 text-[28px] font-bold">{stats.totalUsers}</p>
          </div>

          <div className="rounded-[8px] border border-[#e9e9e9] bg-white p-5">
            <p className="text-sm text-[#6f7278]">Active Players</p>

            <p className="mt-2 text-[28px] font-bold">{stats.activeUsers}</p>
          </div>

          <div className="rounded-[8px] border border-[#e9e9e9] bg-white p-5">
            <p className="text-sm text-[#6f7278]">Suspended Players</p>

            <p className="mt-2 text-[28px] font-bold">{stats.suspendedUsers}</p>
          </div>
        </section>

        {(error || success) && (
          <div
            className={`mt-5 flex items-center justify-between rounded-[7px] border px-4 py-3 text-sm ${
              error
                ? "border-[#f1c5c5] bg-[#fff4f4] text-[#b42318]"
                : "border-[#c9eadb] bg-[#f0fff7] text-[#087443]"
            }`}
          >
            <span>{error || success}</span>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
              }}
              className="rounded p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="mt-6 rounded-[8px] border border-[#e9e9e9] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#ededed] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-[380px]">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9da2]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username or phone..."
                className="h-10 w-full rounded-[5px] border border-[#dedede] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#ff6b00]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-10 rounded-[5px] border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#ff6b00]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Deleted</option>
              </select>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="h-10 rounded-[5px] border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#ff6b00]"
              >
                <option value="AZ">A-Z</option>
                <option value="ZA">Z-A</option>
                <option value="JOINED_ASC">Joined: Oldest</option>
                <option value="JOINED_DESC">Joined: Newest</option>
                <option value="POINTS_DESC">Points: Highest</option>
                <option value="STREAK_DESC">Streak: Highest</option>
              </select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[#ededed] bg-[#fffaf6] px-5 py-3">
              <span className="mr-2 text-sm font-medium">
                {selectedIds.length} selected
              </span>

              <button
                type="button"
                onClick={() => setBulkAction("SUSPEND")}
                className="inline-flex h-9 items-center gap-2 rounded-[5px] border border-[#dedede] bg-white px-3 text-sm font-medium hover:bg-[#f7f7f7]"
              >
                <ShieldOff size={15} />
                Suspend
              </button>

              <button
                type="button"
                onClick={() => setBulkAction("REACTIVATE")}
                className="inline-flex h-9 items-center gap-2 rounded-[5px] border border-[#dedede] bg-white px-3 text-sm font-medium hover:bg-[#f7f7f7]"
              >
                <ShieldCheck size={15} />
                Reactivate
              </button>

              <button
                type="button"
                onClick={() => setBulkAction("DELETE")}
                className="inline-flex h-9 items-center gap-2 rounded-[5px] border border-[#efcaca] bg-white px-3 text-sm font-medium text-[#b42318] hover:bg-[#fff4f4]"
              >
                <Trash2 size={15} />
                Mass Delete
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="ml-auto inline-flex h-9 items-center gap-2 rounded-[5px] px-3 text-sm font-medium text-[#6f7278] hover:bg-[#f4f4f4]"
              >
                Clear
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-[#ededed] bg-[#fafafa] text-left">
                  <th className="w-[50px] px-5 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAllPlayers}
                      aria-label="Select all players"
                    />
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6f7278]">
                    Player
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6f7278]">
                    Phone
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6f7278]">
                    Points
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6f7278]">
                    Games
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6f7278]">
                    Accuracy
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6f7278]">
                    Streak
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6f7278]">
                    Status
                  </th>

                  <th className="w-[60px] px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <Loader2
                        size={22}
                        className="mx-auto animate-spin text-[#ff6b00]"
                      />

                      <p className="mt-3 text-sm text-[#6f7278]">
                        Loading players...
                      </p>
                    </td>
                  </tr>
                ) : players.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <UserRound size={28} className="mx-auto text-[#b0b2b6]" />

                      <p className="mt-3 text-sm font-medium">
                        No players found
                      </p>

                      <p className="mt-1 text-sm text-[#6f7278]">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  players.map((player) => {
                    const accuracy = calculateAccuracy(player);

                    return (
                      <tr
                        key={player.id}
                        className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fcfcfc]"
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(player.id)}
                            onChange={() => togglePlayer(player.id)}
                            aria-label={`Select ${player.username}`}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ffe8d4] text-sm font-bold text-[#ff6b00]">
                              {player.username.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-semibold">
                                {player.username}
                              </p>

                              <p className="mt-0.5 text-xs text-[#8b8e93]">
                                Joined {formatDate(player.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-[#55585d]">
                          {player.phone}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold">
                          {player.totalPoints}
                        </td>

                        <td className="px-4 py-4 text-sm text-[#55585d]">
                          {player.gamesPlayed}
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-sm font-medium">
                            {accuracy}%
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                            <span>🔥</span>
                            {player.currentStreak}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              player.status === "ACTIVE"
                                ? "bg-[#e9f8f0] text-[#087443]"
                                : player.status === "SUSPENDED"
                                  ? "bg-[#fff4df] text-[#9a6700]"
                                  : "bg-[#f1f1f1] text-[#6f7278]"
                            }`}
                          >
                            {player.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={(event) =>
                              openPlayerMenu(event, player.id)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6f7278] hover:bg-[#f0f0f0] hover:text-[#121212]"
                            aria-label={`Actions for ${player.username}`}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {openMenuId && menuPosition && (
        <div
          className="fixed z-50 w-[210px] rounded-[7px] border border-[#e5e5e5] bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.12)]"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {(() => {
            const player = players.find((item) => item.id === openMenuId);

            if (!player) {
              return null;
            }

            return (
              <>
                <button
                  type="button"
                  onClick={() => void openHistory(player)}
                  className="flex w-full items-center gap-3 rounded-[5px] px-3 py-2.5 text-left text-sm hover:bg-[#f7f7f7]"
                >
                  <History size={16} />
                  View History
                </button>

                {player.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() => openIndividualAction(player, "SUSPEND")}
                    className="flex w-full items-center gap-3 rounded-[5px] px-3 py-2.5 text-left text-sm hover:bg-[#f7f7f7]"
                  >
                    <ShieldOff size={16} />
                    Suspend Player
                  </button>
                ) : player.status === "SUSPENDED" ? (
                  <button
                    type="button"
                    onClick={() => openIndividualAction(player, "REACTIVATE")}
                    className="flex w-full items-center gap-3 rounded-[5px] px-3 py-2.5 text-left text-sm hover:bg-[#f7f7f7]"
                  >
                    <ShieldCheck size={16} />
                    Reactivate Player
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => openIndividualAction(player, "DELETE")}
                  className="flex w-full items-center gap-3 rounded-[5px] px-3 py-2.5 text-left text-sm text-[#b42318] hover:bg-[#fff4f4]"
                >
                  <Trash2 size={16} />
                  Delete Player
                </button>
              </>
            );
          })()}
        </div>
      )}

      {historyPlayer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-5">
          <div className="max-h-[85vh] w-full max-w-[850px] overflow-hidden rounded-[8px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between border-b border-[#ededed] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ff6b00]">
                  Player History
                </p>

                <h2 className="mt-1 text-[20px] font-bold">
                  {historyPlayer.username}
                </h2>

                <p className="mt-1 text-sm text-[#6f7278]">
                  {historyPlayer.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                className="flex h-9 w-9 items-center justify-center rounded-[5px] hover:bg-[#f4f4f4]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6">
              {historyLoading ? (
                <div className="py-14 text-center">
                  <Loader2
                    size={22}
                    className="mx-auto animate-spin text-[#ff6b00]"
                  />

                  <p className="mt-3 text-sm text-[#6f7278]">
                    Loading history...
                  </p>
                </div>
              ) : historyError ? (
                <div className="rounded-[7px] border border-[#f1c5c5] bg-[#fff4f4] p-4 text-sm text-[#b42318]">
                  {historyError}
                </div>
              ) : gameHistory.length === 0 ? (
                <div className="py-14 text-center">
                  <Clock3 size={28} className="mx-auto text-[#b0b2b6]" />

                  <p className="mt-3 text-sm font-medium">
                    No game history yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#ededed] text-left">
                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6f7278]">
                          Date
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6f7278]">
                          Status
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6f7278]">
                          Score
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6f7278]">
                          Correct
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6f7278]">
                          Incorrect
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6f7278]">
                          Questions
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#6f7278]">
                          Duration
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {gameHistory.map((game) => (
                        <tr
                          key={game.id}
                          className="border-b border-[#f0f0f0] last:border-b-0"
                        >
                          <td className="px-3 py-4 text-sm">
                            {formatDateTime(game.startedAt)}
                          </td>

                          <td className="px-3 py-4">
                            <span className="rounded-full bg-[#f3f3f3] px-2.5 py-1 text-xs font-semibold">
                              {game.status}
                            </span>
                          </td>

                          <td className="px-3 py-4 text-sm font-semibold">
                            {game.score}
                          </td>

                          <td className="px-3 py-4 text-sm text-[#087443]">
                            {game.correctAnswers}
                          </td>

                          <td className="px-3 py-4 text-sm text-[#b42318]">
                            {game.incorrectAnswers}
                          </td>

                          <td className="px-3 py-4 text-sm">
                            {game.questionsAnswered}/{game.totalQuestions}
                          </td>

                          <td className="px-3 py-4 text-sm text-[#55585d]">
                            {formatDuration(game.durationSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {bulkAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5">
          <div className="w-full max-w-[430px] rounded-[8px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4df] text-[#9a6700]">
              <AlertTriangle size={21} />
            </div>

            <h2 className="mt-4 text-[19px] font-bold">
              {getBulkLabel(bulkAction)} Players?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6f7278]">
              You are about to{" "}
              {bulkAction === "SUSPEND"
                ? "suspend"
                : bulkAction === "REACTIVATE"
                  ? "reactivate"
                  : "delete"}{" "}
              {selectedIds.length} selected player
              {selectedIds.length === 1 ? "" : "s"}. This action will affect all
              selected accounts.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => setBulkAction(null)}
                className="h-10 rounded-[5px] border border-[#dedede] px-4 text-sm font-medium hover:bg-[#f7f7f7]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => void executeBulkAction()}
                className={`inline-flex h-10 items-center gap-2 rounded-[5px] px-4 text-sm font-semibold text-white ${
                  bulkAction === "DELETE"
                    ? "bg-[#b42318] hover:bg-[#9e1f16]"
                    : "bg-[#ff6b00] hover:bg-[#e85f00]"
                }`}
              >
                {bulkProcessing && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {actionPlayer && individualAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5">
          <div className="w-full max-w-[430px] rounded-[8px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                individualAction === "DELETE"
                  ? "bg-[#fff0f0] text-[#b42318]"
                  : "bg-[#fff4df] text-[#9a6700]"
              }`}
            >
              {individualAction === "DELETE" ? (
                <Trash2 size={21} />
              ) : (
                <AlertTriangle size={21} />
              )}
            </div>

            <h2 className="mt-4 text-[19px] font-bold">
              {individualAction === "SUSPEND"
                ? "Suspend Player?"
                : individualAction === "REACTIVATE"
                  ? "Reactivate Player?"
                  : "Delete Player?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6f7278]">
              {individualAction === "SUSPEND"
                ? `Are you sure you want to suspend ${actionPlayer.username}?`
                : individualAction === "REACTIVATE"
                  ? `Are you sure you want to reactivate ${actionPlayer.username}?`
                  : `Are you sure you want to delete ${actionPlayer.username}? This action cannot be undone.`}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={actionProcessing}
                onClick={() => {
                  setActionPlayer(null);
                  setIndividualAction(null);
                }}
                className="h-10 rounded-[5px] border border-[#dedede] px-4 text-sm font-medium hover:bg-[#f7f7f7]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionProcessing}
                onClick={() => void executeIndividualAction()}
                className={`inline-flex h-10 items-center gap-2 rounded-[5px] px-4 text-sm font-semibold text-white ${
                  individualAction === "DELETE"
                    ? "bg-[#b42318] hover:bg-[#9e1f16]"
                    : "bg-[#ff6b00] hover:bg-[#e85f00]"
                }`}
              >
                {actionProcessing && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
