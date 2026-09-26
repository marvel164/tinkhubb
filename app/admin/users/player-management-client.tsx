"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Filter,
  Flame,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function statusLabel(status: PlayerStatus) {
  if (status === "ACTIVE") return "Active";
  if (status === "SUSPENDED") return "Suspended";
  return "Deleted";
}

function StatusBadge({ status }: { status: PlayerStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[9px] font-semibold leading-none",
        status === "ACTIVE"
          ? "bg-[#e8f8f0] text-[#168052] dark:bg-[#153526] dark:text-[#66d9a0]"
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
      {statusLabel(status)}
    </span>
  );
}

export default function PlayerManagementClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [, setStats] = useState<PlayerStats>({
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

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

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
    setPage(1);

    const timeout = window.setTimeout(() => {
      void loadPlayers();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, statusFilter, sort]);

  useEffect(() => {
    function handleOutsideClick() {
      setOpenMenuId(null);
      setMenuPosition(null);
      setFilterOpen(false);
      setSortOpen(false);
    }

    if (!openMenuId && !filterOpen && !sortOpen) {
      return;
    }

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [openMenuId, filterOpen, sortOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setOpenMenuId(null);
      setMenuPosition(null);
      setFilterOpen(false);
      setSortOpen(false);

      if (!bulkProcessing) {
        setBulkAction(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [bulkProcessing]);

  const totalPages = Math.max(1, Math.ceil(players.length / pageSize));

  const visiblePlayers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return players.slice(start, start + pageSize);
  }, [players, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleIds = visiblePlayers.map((player) => player.id);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function togglePlayer(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );

      return;
    }

    setSelectedIds((current) => [
      ...current,
      ...visibleIds.filter((id) => !current.includes(id)),
    ]);
  }

  function openPlayerMenu(
    event: React.MouseEvent<HTMLButtonElement>,
    playerId: string,
  ) {
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();

    setFilterOpen(false);
    setSortOpen(false);
    setOpenMenuId(playerId);

    setMenuPosition({
      top: rect.bottom + 6,
      left: Math.max(12, rect.right - 190),
    });
  }

  async function executeBulkAction() {
    if (!bulkAction || selectedIds.length === 0) return;

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

      const noun =
        bulkAction === "SUSPEND"
          ? "suspended"
          : bulkAction === "REACTIVATE"
            ? "reactivated"
            : "deleted";

      setSuccess(`${selectedIds.length} player(s) ${noun} successfully.`);
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

  function openBulkAction(action: BulkAction) {
    setError("");
    setSuccess("");
    setBulkAction(action);
  }

  function getBulkTitle(action: BulkAction) {
    if (action === "SUSPEND") return "Suspend Players?";
    if (action === "REACTIVATE") return "Reactivate Players?";
    return "Delete Players?";
  }

  function getBulkDescription(action: BulkAction) {
    const count = selectedIds.length;
    const noun = count === 1 ? "player" : "players";

    if (action === "SUSPEND") {
      return `You are about to suspend ${count} selected ${noun}.`;
    }

    if (action === "REACTIVATE") {
      return `You are about to reactivate ${count} selected ${noun}.`;
    }

    return `You are about to delete ${count} selected ${noun}. This action cannot be undone.`;
  }

  function chooseSort(value: SortOption) {
    setSort(value);
    setSortOpen(false);
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f5f6f8] px-4 py-6 text-[#171717] transition-colors dark:bg-[#151210] dark:text-[#fff4ec] sm:px-5 md:px-7 md:py-7">
      <div className="mx-auto max-w-[1280px]">
        {/* PAGE HEADER */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.04em] sm:text-[27px]">
              Player Management
            </h1>

            <p className="mt-1.5 text-[10px] text-[#73777d] sm:text-[11px] dark:text-[#aaa19c]">
              Search players, view history and moderate accounts
            </p>
          </div>

          <Link
            href="/admin/leaderboard"
            className="inline-flex h-9 items-center justify-center rounded-[4px] bg-[#ff6b00] px-7 text-[10px] font-semibold text-white transition hover:bg-[#e96000] sm:h-10 sm:text-[11px]"
          >
            Export
          </Link>
        </section>

        {/* FEEDBACK */}
        {(error || success) && (
          <div
            className={[
              "mt-5 flex items-center justify-between gap-4 rounded-[5px] border px-4 py-3 text-[10px]",
              error
                ? "border-[#efcaca] bg-[#fff5f5] text-[#b42318] dark:border-[#51252a] dark:bg-[#30191b] dark:text-[#ff929b]"
                : "border-[#c8e8d7] bg-[#f2fff7] text-[#087443] dark:border-[#244a38] dark:bg-[#172a20] dark:text-[#75ddb0]",
            ].join(" ")}
          >
            <span>{error || success}</span>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
              }}
              className="shrink-0 rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* MAIN PLAYER CARD */}
        <section className="mt-7 overflow-visible rounded-[7px] border border-[#e5e7ea] bg-white dark:border-[#332a25] dark:bg-[#1c1815]">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-4 border-b border-[#eeeeef] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between dark:border-[#302824]">
            {/* STATUS TABS */}
            <div className="flex items-center gap-1">
              {(
                [
                  ["ALL", "All"],
                  ["ACTIVE", "Active"],
                  ["SUSPENDED", "Suspended"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={[
                    "relative px-3.5 py-2 text-[10px] font-medium transition sm:px-4",
                    statusFilter === value
                      ? "font-semibold text-[#ff6b00]"
                      : "text-[#85888d] hover:text-[#451900] dark:hover:text-[#fff4ec]",
                  ].join(" ")}
                >
                  {label}

                  {statusFilter === value && (
                    <span className="absolute inset-x-1 bottom-[-17px] h-[2px] rounded-full bg-[#ff6b00]" />
                  )}
                </button>
              ))}
            </div>

            {/* SEARCH + CONTROLS */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:w-[245px] sm:flex-none">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da0a5]"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search..."
                  className="h-9 w-full rounded-[5px] border border-[#e0e2e5] bg-white pl-9 pr-3 text-[10px] outline-none transition placeholder:text-[#a3a6aa] focus:border-[#ff6b00] dark:border-[#3b322d] dark:bg-[#211b18] dark:text-[#fff4ec]"
                />
              </div>

              {/* FILTER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSortOpen(false);
                    setFilterOpen((value) => !value);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-[#e0e2e5] bg-white px-3 text-[10px] font-medium text-[#55585d] hover:bg-[#fafafa] dark:border-[#3b322d] dark:bg-[#211b18] dark:text-[#cfc4bd]"
                >
                  <Filter size={13} />
                  Filter
                  <ChevronDown size={12} />
                </button>

                {filterOpen && (
                  <div
                    className="absolute right-0 top-11 z-40 w-[170px] rounded-[6px] border border-[#e3e4e6] bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.12)] dark:border-[#3b322d] dark:bg-[#211b18]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <p className="px-2.5 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-[#9b9da1]">
                      Status
                    </p>

                    {(
                      [
                        ["ALL", "All"],
                        ["ACTIVE", "Active"],
                        ["SUSPENDED", "Suspended"],
                        ["DELETED", "Deleted"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(value);
                          setFilterOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-[4px] px-2.5 py-2 text-left text-[10px] hover:bg-[#f7f7f8] dark:hover:bg-[#2a211d]"
                      >
                        {label}

                        {statusFilter === value && (
                          <Check size={12} className="text-[#ff6b00]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SORT */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFilterOpen(false);
                    setSortOpen((value) => !value);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-[#e0e2e5] bg-white px-3 text-[10px] font-medium text-[#55585d] hover:bg-[#fafafa] dark:border-[#3b322d] dark:bg-[#211b18] dark:text-[#cfc4bd]"
                >
                  Sort by
                  <ChevronDown size={12} />
                </button>

                {sortOpen && (
                  <div
                    className="absolute right-0 top-11 z-40 w-[185px] rounded-[6px] border border-[#e3e4e6] bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.12)] dark:border-[#3b322d] dark:bg-[#211b18]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {(
                      [
                        ["AZ", "A-Z"],
                        ["ZA", "Z-A"],
                        ["JOINED_ASC", "Joined: Oldest"],
                        ["JOINED_DESC", "Joined: Newest"],
                        ["POINTS_DESC", "Points: Highest"],
                        ["STREAK_DESC", "Streak: Highest"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => chooseSort(value)}
                        className="flex w-full items-center justify-between rounded-[4px] px-2.5 py-2 text-left text-[10px] hover:bg-[#f7f7f8] dark:hover:bg-[#2a211d]"
                      >
                        {label}

                        {sort === value && (
                          <Check size={12} className="text-[#ff6b00]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BULK ACTION BAR */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[#f0e2d8] bg-[#fff9f4] px-4 py-2.5 dark:border-[#493126] dark:bg-[#241a15] sm:px-5">
              <span className="mr-1 text-[10px] font-semibold">
                {selectedIds.length} selected
              </span>

              <button
                type="button"
                onClick={() => openBulkAction("SUSPEND")}
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#dedfe2] bg-white px-2.5 text-[9px] font-medium hover:bg-[#f7f7f7] dark:border-[#413831] dark:bg-[#211b18]"
              >
                <ShieldOff size={12} />
                Suspend
              </button>

              <button
                type="button"
                onClick={() => openBulkAction("REACTIVATE")}
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#dedfe2] bg-white px-2.5 text-[9px] font-medium hover:bg-[#f7f7f7] dark:border-[#413831] dark:bg-[#211b18]"
              >
                <ShieldCheck size={12} />
                Reactivate
              </button>

              <button
                type="button"
                onClick={() => openBulkAction("DELETE")}
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#efcaca] bg-white px-2.5 text-[9px] font-medium text-[#b42318] hover:bg-[#fff5f5] dark:border-[#54292d] dark:bg-[#211b18] dark:text-[#ff858d]"
              >
                <Trash2 size={12} />
                Delete
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="ml-auto h-8 rounded-[4px] px-2.5 text-[9px] font-medium text-[#777b80] hover:bg-black/5 dark:text-[#aaa19c]"
              >
                Clear
              </button>
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#f7f7f8] dark:bg-[#241e1a]">
                  <th className="w-[48px] px-4 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Select visible players"
                      className="h-3.5 w-3.5 accent-[#ff6b00]"
                    />
                  </th>

                  {[
                    "USERNAME",
                    "PHONE NUMBER",
                    "POINTS",
                    "STREAK",
                    "GAMES",
                    "RANK",
                    "STATUS",
                    "ACTION",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={[
                        "px-3 py-2.5 text-left text-[8px] font-bold tracking-[0.035em] text-[#74777c] dark:text-[#9e948d]",
                        heading === "ACTION" ? "w-[65px]" : "",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        {heading}

                        {heading !== "ACTION" && (
                          <span className="text-[8px] text-[#a9acb0]">↕</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-20 text-center">
                      <Loader2
                        size={19}
                        className="mx-auto animate-spin text-[#ff6b00]"
                      />

                      <p className="mt-3 text-[10px] text-[#777b80] dark:text-[#aaa19c]">
                        Loading players...
                      </p>
                    </td>
                  </tr>
                ) : visiblePlayers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-20 text-center">
                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0e5] text-[#ff6b00] dark:bg-[#382319]">
                        <Search size={17} />
                      </div>

                      <p className="mt-3 text-[11px] font-semibold">
                        No players found
                      </p>

                      <p className="mt-1 text-[10px] text-[#7c8085] dark:text-[#aaa19c]">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  visiblePlayers.map((player, index) => {
                    const absoluteIndex = (page - 1) * pageSize + index + 1;

                    return (
                      <tr
                        key={player.id}
                        className="border-t border-[#eeeeef] transition-colors hover:bg-[#fcfcfc] dark:border-[#302824] dark:hover:bg-[#241e1a]"
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(player.id)}
                            onChange={() => togglePlayer(player.id)}
                            aria-label={`Select ${player.username}`}
                            className="h-3.5 w-3.5 accent-[#ff6b00]"
                          />
                        </td>

                        <td className="px-3 py-3.5">
                          <Link
                            href={`/admin/users/${player.id}`}
                            className="text-[10px] font-semibold text-[#292b2f] hover:text-[#ff6b00] dark:text-[#fff4ec]"
                          >
                            {player.username}
                          </Link>
                        </td>

                        <td className="px-3 py-3.5 text-[9px] text-[#55585d] dark:text-[#b7ada7]">
                          {player.phone}
                        </td>

                        <td className="px-3 py-3.5 text-[10px] font-semibold">
                          {player.totalPoints.toLocaleString("en-NG")}
                        </td>

                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                            <Flame
                              size={14}
                              strokeWidth={2}
                              className="text-[#ff6b00]"
                              fill="currentColor"
                            />
                            {player.currentStreak}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 text-[9px] text-[#55585d] dark:text-[#b7ada7]">
                          {player.gamesPlayed}
                        </td>

                        <td className="px-3 py-3.5 text-[10px] font-medium text-[#55585d] dark:text-[#b7ada7]">
                          #{absoluteIndex}
                        </td>

                        <td className="px-3 py-3.5">
                          <StatusBadge status={player.status} />
                        </td>

                        <td className="px-3 py-3.5">
                          <button
                            type="button"
                            onClick={(event) =>
                              openPlayerMenu(event, player.id)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[#85888d] hover:bg-[#f0f0f1] hover:text-[#222] dark:hover:bg-[#2b2420] dark:hover:text-white"
                            aria-label={`Actions for ${player.username}`}
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-3 border-t border-[#eeeeef] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#302824]">
            <p className="text-[9px] text-[#777b80] dark:text-[#aaa19c]">
              Showing{" "}
              <strong className="text-[#45484d] dark:text-[#ddd4ce]">
                {players.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, players.length)}
              </strong>{" "}
              of <strong>{players.length}</strong> entries
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#e2e3e5] text-[#7f8287] disabled:opacity-30 dark:border-[#3a322d]"
                aria-label="First page"
              >
                <ChevronsLeft size={12} />
              </button>

              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#e2e3e5] text-[#7f8287] disabled:opacity-30 dark:border-[#3a322d]"
                aria-label="Previous page"
              >
                <ChevronLeft size={12} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }).map(
                (_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={[
                        "flex h-7 min-w-7 items-center justify-center rounded-[4px] px-2 text-[9px] font-medium",
                        page === pageNumber
                          ? "bg-[#ff6b00] text-white"
                          : "border border-[#e2e3e5] text-[#666a70] hover:bg-[#f6f6f6] dark:border-[#3a322d] dark:text-[#aaa19c] dark:hover:bg-[#2a211d]",
                      ].join(" ")}
                    >
                      {pageNumber}
                    </button>
                  );
                },
              )}

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#e2e3e5] text-[#7f8287] disabled:opacity-30 dark:border-[#3a322d]"
                aria-label="Next page"
              >
                <ChevronRight size={12} />
              </button>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#e2e3e5] text-[#7f8287] disabled:opacity-30 dark:border-[#3a322d]"
                aria-label="Last page"
              >
                <ChevronsRight size={12} />
              </button>
            </div>

            <span className="hidden text-[9px] text-[#85888d] sm:block">
              {page} / {totalPages}
            </span>
          </div>
        </section>
      </div>

      {/* ACTION MENU */}
      {openMenuId && menuPosition && (
        <div
          className="fixed z-[70] w-[190px] rounded-[6px] border border-[#e2e3e5] bg-white p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.14)] dark:border-[#3b322d] dark:bg-[#211b18]"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {(() => {
            const player = players.find((item) => item.id === openMenuId);

            if (!player) return null;

            return (
              <>
                <Link
                  href={`/admin/users/${player.id}`}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2.5 text-[10px] hover:bg-[#f6f6f7] dark:hover:bg-[#2a211d]"
                >
                  <Eye size={14} />
                  View
                </Link>

                {player.status === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      setBulkAction(null);
                      setSelectedIds([]);
                      window.location.href = `/admin/users/${player.id}?action=suspend`;
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2.5 text-left text-[10px] hover:bg-[#f6f6f7] dark:hover:bg-[#2a211d]"
                  >
                    <ShieldOff size={14} />
                    Suspend
                  </button>
                )}

                {player.status === "SUSPENDED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      window.location.href = `/admin/users/${player.id}?action=reactivate`;
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2.5 text-left text-[10px] hover:bg-[#f6f6f7] dark:hover:bg-[#2a211d]"
                  >
                    <ShieldCheck size={14} />
                    Reactivate
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuId(null);
                    setMenuPosition(null);
                    setSelectedIds([player.id]);
                    setBulkAction("DELETE");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2.5 text-left text-[10px] text-[#b42318] hover:bg-[#fff4f4] dark:text-[#ff858d] dark:hover:bg-[#30191b]"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* BULK CONFIRMATION */}
      {bulkAction && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-[430px] rounded-[8px] border border-[#e5e5e6] bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.22)] dark:border-[#40352f] dark:bg-[#211b18]">
            <div className="flex justify-center">
              <div
                className={[
                  "flex h-[74px] w-[74px] items-center justify-center rounded-[18px]",
                  bulkAction === "DELETE"
                    ? "bg-[#ffe6e8] text-[#df3d5d] dark:bg-[#412027] dark:text-[#ff8299]"
                    : "bg-[#fff0e5] text-[#ff6b00] dark:bg-[#3b2519]",
                ].join(" ")}
              >
                {bulkAction === "DELETE" ? (
                  <Trash2 size={30} strokeWidth={1.8} />
                ) : (
                  <AlertTriangle size={30} strokeWidth={1.8} />
                )}
              </div>
            </div>

            <h2 className="mt-6 text-center text-[19px] font-bold">
              {getBulkTitle(bulkAction)}
            </h2>

            <p className="mx-auto mt-3 max-w-[340px] text-center text-[10px] leading-6 text-[#777b80] dark:text-[#aaa19c]">
              {getBulkDescription(bulkAction)}
            </p>

            <div className="mt-7 flex justify-center gap-2.5">
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => setBulkAction(null)}
                className="h-10 min-w-[110px] rounded-[4px] border border-[#dedfe2] px-4 text-[10px] font-semibold text-[#55585d] hover:bg-[#f7f7f7] dark:border-[#423831] dark:text-[#c7bdb6] dark:hover:bg-[#2a211d]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => void executeBulkAction()}
                className={[
                  "inline-flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-[4px] px-4 text-[10px] font-semibold text-white",
                  bulkAction === "DELETE"
                    ? "bg-[#d83c58] hover:bg-[#c5324d]"
                    : "bg-[#ff6b00] hover:bg-[#e96000]",
                ].join(" ")}
              >
                {bulkProcessing && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
