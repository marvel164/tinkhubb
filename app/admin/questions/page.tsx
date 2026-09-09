"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  AlertTriangle,
  Check,
  ChevronDown,

  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Question = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  category: string;
  difficulty: string;
  status: "ACTIVE" | "INACTIVE";
  points: number;
  createdAt: string;
  updatedAt: string;
};

const categories: readonly (readonly [string, string])[] = [
  ["GENERAL_KNOWLEDGE", "General Knowledge"],
  ["SCIENCE", "Science"],
  ["HISTORY", "History"],
  ["SPORTS", "Sports"],
  ["GEOGRAPHY", "Geography"],
  ["ENTERTAINMENT", "Entertainment"],
  ["TECHNOLOGY", "Technology"],
  ["BUSINESS", "Business"],
  ["CURRENT_AFFAIRS", "Current Affairs"],
];

const difficulties: readonly (readonly [string, string])[] = [
  ["EASY", "Easy"],
  ["MEDIUM", "Medium"],
  ["HARD", "Hard"],
];

function formatCategory(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [sortAscending, setSortAscending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"DELETE" | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A" as "A" | "B" | "C" | "D",
    category: "GENERAL_KNOWLEDGE",
    difficulty: "MEDIUM",
    points: "1",
  });

  async function loadQuestions() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (activeTab !== "ALL") {
        params.set("status", activeTab);
      }

      params.set("sort", sortAscending ? "asc" : "desc");

      const response = await fetch(
        `/api/admin/questions?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load questions.");
      }

      setQuestions(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load questions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuestions();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, activeTab, sortAscending]);

  const counts = useMemo(
    () => ({
      all: questions.length,
      active: questions.filter((item) => item.status === "ACTIVE").length,
      inactive: questions.filter((item) => item.status === "INACTIVE").length,
    }),
    [questions],
  );

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      category: "GENERAL_KNOWLEDGE",
      difficulty: "MEDIUM",
      points: "1",
    });
  }

  function openCreateModal() {
    setError("");
    setSuccess("");
    setEditingQuestion(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(question: Question) {
    setError("");
    setSuccess("");
    setEditingQuestion(question);

    setForm({
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      category: question.category,
      difficulty: question.difficulty,
      points: String(question.points),
    });

    setShowModal(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = Boolean(editingQuestion);

      const response = await fetch(
        isEditing
          ? `/api/admin/questions/${editingQuestion!.id}`
          : "/api/admin/questions",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: form.question,
            optionA: form.optionA,
            optionB: form.optionB,
            optionC: form.optionC,
            optionD: form.optionD,
            correctOption: form.correctOption,
            category: form.category,
            difficulty: form.difficulty,
            points: Number(form.points),
            status: editingQuestion?.status ?? "ACTIVE",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Unable to update question."
              : "Unable to create question."),
        );
      }

      resetForm();
      setEditingQuestion(null);
      setShowModal(false);

      setSuccess(
        isEditing
          ? "Question updated successfully."
          : "Question created successfully.",
      );

      await loadQuestions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingQuestion
            ? "Unable to update question."
            : "Unable to create question.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(question: Question) {
    setError("");
    setSuccess("");
    setDeleteQuestion(question);
  }

  function closeDeleteModal() {
    if (deletingId) {
      return;
    }

    setDeleteQuestion(null);
  }

  async function handleDelete() {
    if (!deleteQuestion) {
      return;
    }

    const question = deleteQuestion;

    setDeletingId(question.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/questions/${question.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete question.");
      }

      setDeleteQuestion(null);
      setSuccess("Question deleted successfully.");
      await loadQuestions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete question.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const allVisibleSelected =
    questions.length > 0 &&
    questions.every((question) => selectedIds.includes(question.id));

  function toggleQuestionSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(questions.map((question) => question.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function handleBulkAction(action: "ACTIVATE" | "DEACTIVATE") {
    if (selectedIds.length === 0) return;

    const selectedQuestions = getSelectedQuestions();
    const targetStatus = action === "ACTIVATE" ? "ACTIVE" : "INACTIVE";

    const alreadyInTargetState = selectedQuestions.filter(
      (question) => question.status === targetStatus,
    );

    const questionsToUpdate = selectedQuestions.filter(
      (question) => question.status !== targetStatus,
    );

    if (questionsToUpdate.length === 0) {
      setError("");
      setSuccess(
        "All " +
          selectedQuestions.length +
          " selected question" +
          (selectedQuestions.length === 1 ? "" : "s") +
          " are already " +
          (action === "ACTIVATE" ? "active" : "inactive") +
          ".",
      );
      return;
    }

    setBulkProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          questionIds: questionsToUpdate.map((question) => question.id),
        }),
      });

      const data = await response.json();

      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          data.message || "Unable to complete the bulk action.",
        );
      }

      setSelectedIds([]);
      await loadQuestions();

      const changedCount = questionsToUpdate.length;
      const skippedCount = alreadyInTargetState.length;

      let message =
        changedCount +
        " question" +
        (changedCount === 1 ? "" : "s") +
        " " +
        (action === "ACTIVATE" ? "activated" : "deactivated") +
        " successfully.";

      if (skippedCount > 0) {
        message +=
          " " +
          skippedCount +
          " " +
          (skippedCount === 1 ? "was" : "were") +
          " already " +
          (action === "ACTIVATE" ? "active" : "inactive") +
          ".";
      }

      setSuccess(message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the bulk action.",
      );
    } finally {
      setBulkProcessing(false);
    }
  }

function openBulkDeleteModal() {
    if (selectedIds.length === 0) {
      return;
    }

    setError("");
    setSuccess("");
    setBulkAction("DELETE");
  }

  function closeBulkDeleteModal() {
    if (bulkProcessing) {
      return;
    }

    setBulkAction(null);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) {
      return;
    }

    setBulkProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "DELETE",
          questionIds: selectedIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete the selected questions.",
        );
      }

      setBulkAction(null);
      setSelectedIds([]);
      setSuccess(data.message);
      await loadQuestions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the selected questions.",
      );
    } finally {
      setBulkProcessing(false);
    }
  }

  function getSelectedQuestions() {
    return questions.filter((question) => selectedIds.includes(question.id));
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-[#121212]">
      <header className="flex h-[72px] items-center justify-between border-b border-[#e8e8e8] bg-white px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff6b00]">
            TinkHubb Admin
          </p>
          <h1 className="mt-1 text-[22px] font-bold tracking-[-0.02em]">
            Question Bank
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center gap-2 rounded-[5px] bg-[#ff6b00] px-4 text-sm font-semibold text-white transition hover:bg-[#e85f00]"
        >
          <Plus size={17} />
          Add New Question
        </button>
      </header>

      <section className="px-8 py-7">
        <div className="mx-auto max-w-[1400px]">
          {success && (
            <div className="mb-5 flex items-center justify-between rounded-[5px] border border-[#b9e2cc] bg-[#f0fff6] px-4 py-3 text-sm text-[#167044]">
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                aria-label="Dismiss success message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center justify-between rounded-[5px] border border-[#f2c7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#b42318]">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error message"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="border-b border-[#dedede]">
            <div className="flex gap-7">
              {[
                ["ALL", "All Questions", counts.all],
                ["ACTIVE", "Active", counts.active],
                ["INACTIVE", "Inactive", counts.inactive],
              ].map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setActiveTab(value as "ALL" | "ACTIVE" | "INACTIVE")
                  }
                  className={`relative pb-3 text-sm font-semibold transition ${
                    activeTab === value
                      ? "text-[#ff6b00]"
                      : "text-[#6f7278] hover:text-[#121212]"
                  }`}
                >
                  {label}
                  <span className="ml-2 rounded-full bg-[#f1f1f1] px-2 py-0.5 text-[10px]">
                    {count}
                  </span>

                  {activeTab === value && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#ff6b00]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-[6px] border border-[#ffd7bd] bg-[#fff8f3] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#ff6b00] px-2 text-xs font-bold text-white">
                  {selectedIds.length}
                </span>

                <span className="text-sm font-semibold text-[#45484d]">
                  {selectedIds.length === 1
                    ? "question selected"
                    : "questions selected"}
                </span>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={bulkProcessing}
                  className="text-xs font-medium text-[#6f7278] underline underline-offset-2 hover:text-[#121212] disabled:opacity-50"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleBulkAction("ACTIVATE")}
                  disabled={bulkProcessing}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-[#b9e2cc] bg-white px-3 text-xs font-semibold text-[#167044] transition hover:bg-[#f0fff6] disabled:opacity-50"
                >
                  <Check size={14} />
                  Activate
                </button>

                <button
                  type="button"
                  onClick={() => void handleBulkAction("DEACTIVATE")}
                  disabled={bulkProcessing}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-[#dedede] bg-white px-3 text-xs font-semibold text-[#45484d] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                >
                  Deactivate
                </button>

                <button
                  type="button"
                  onClick={openBulkDeleteModal}
                  disabled={bulkProcessing}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[5px] bg-[#d92d20] px-3 text-xs font-semibold text-white transition hover:bg-[#b42318] disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Mass Delete
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="relative max-w-[390px] flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b8e93]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions..."
                className="h-10 w-full rounded-[5px] border border-[#dedede] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10"
              />
            </div>

            <button
              type="button"
              onClick={() => setSortAscending((current) => !current)}
              className="inline-flex h-10 items-center gap-2 rounded-[5px] border border-[#dedede] bg-white px-3.5 text-xs font-semibold text-[#45484d] hover:bg-[#fafafa]"
              title={
                sortAscending ? "Currently sorted A–Z" : "Currently sorted Z–A"
              }
            >
              {sortAscending ? (
                <ArrowDownAZ size={16} />
              ) : (
                <ArrowUpAZ size={16} />
              )}
              {sortAscending ? "A–Z" : "Z–A"}
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-[6px] border border-[#e4e4e4] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e8e8] bg-[#fafafa] text-left">
                    <th className="w-[52px] px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        disabled={loading || questions.length === 0}
                        aria-label="Select all visible questions"
                        className="h-4 w-4 rounded border-[#cfcfcf] accent-[#ff6b00]"
                      />
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6f7278]">
                      Question
                    </th>
                    <th className="w-[160px] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6f7278]">
                      Category
                    </th>
                    <th className="w-[110px] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6f7278]">
                      Difficulty
                    </th>
                    <th className="w-[100px] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6f7278]">
                      Points
                    </th>
                    <th className="w-[120px] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6f7278]">
                      Status
                    </th>
                    <th className="w-[130px] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6f7278]">
                      Created
                    </th>
                    <th className="w-[120px] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6f7278]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-14">
                        <div className="flex items-center justify-center gap-2 text-sm text-[#6f7278]">
                          <Loader2 size={17} className="animate-spin" />
                          Loading questions...
                        </div>
                      </td>
                    </tr>
                  ) : questions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <p className="text-sm font-semibold">
                          No questions found
                        </p>
                        <p className="mt-1 text-xs text-[#6f7278]">
                          {search
                            ? "Try a different search term."
                            : "Add your first trivia question to get started."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    questions.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-[#eeeeee] last:border-b-0 hover:bg-[#fcfcfc] ${
                          selectedIds.includes(item.id) ? "bg-[#fffaf6]" : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleQuestionSelection(item.id)}
                            aria-label={`Select question: ${item.question}`}
                            className="h-4 w-4 rounded border-[#cfcfcf] accent-[#ff6b00]"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[600px] text-sm font-medium leading-5">
                            {item.question}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-xs text-[#45484d]">
                          {formatCategory(item.category)}
                        </td>

                        <td className="px-5 py-4 text-xs text-[#45484d]">
                          {item.difficulty.charAt(0) +
                            item.difficulty.slice(1).toLowerCase()}
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold">
                          {item.points}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              item.status === "ACTIVE"
                                ? "bg-[#eaf8f0] text-[#167044]"
                                : "bg-[#f1f1f1] text-[#6f7278]"
                            }`}
                          >
                            {item.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-[#6f7278]">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              disabled={deletingId === item.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6f7278] transition hover:bg-[#fff3e8] hover:text-[#ff6b00] disabled:opacity-50"
                              title="Edit question"
                              aria-label={`Edit question: ${item.question}`}
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(item)}
                              disabled={deletingId === item.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6f7278] transition hover:bg-[#fff1f1] hover:text-[#b42318] disabled:opacity-50"
                              title="Delete question"
                              aria-label={`Delete question: ${item.question}`}
                            >
                              {deletingId === item.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-[650px] overflow-y-auto rounded-[7px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e8e8e8] px-6 py-5">
              <div>
                <h2 className="text-[19px] font-bold">
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </h2>
                <p className="mt-1 text-xs text-[#6f7278]">
                  {editingQuestion
                    ? "Update this question in the TinkHubb question bank."
                    : "Create a question for the TinkHubb question bank."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 text-[#6f7278] hover:bg-[#f3f3f3] hover:text-[#121212]"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Question Text
                </label>

                <textarea
                  value={form.question}
                  onChange={(event) =>
                    updateForm("question", event.target.value)
                  }
                  required
                  rows={3}
                  placeholder="Enter the trivia question..."
                  className="w-full resize-none rounded-[5px] border border-[#dedede] px-3 py-2.5 text-sm outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold">Options</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["A", "optionA"],
                      ["B", "optionB"],
                      ["C", "optionC"],
                      ["D", "optionD"],
                    ] as const
                  ).map(([letter, field]) => (
                    <div key={field}>
                      <label className="mb-1.5 block text-[11px] font-medium text-[#6f7278]">
                        Option {letter}
                      </label>

                      <input
                        value={form[field]}
                        onChange={(event) =>
                          updateForm(field, event.target.value)
                        }
                        required
                        placeholder={`Option ${letter}`}
                        className="h-10 w-full rounded-[5px] border border-[#dedede] px-3 text-sm outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Correct Answer"
                  value={form.correctOption}
                  onChange={(value) => updateForm("correctOption", value)}
                  options={[
                    ["A", "Option A"],
                    ["B", "Option B"],
                    ["C", "Option C"],
                    ["D", "Option D"],
                  ]}
                />

                <SelectField
                  label="Category"
                  value={form.category}
                  onChange={(value) => updateForm("category", value)}
                  options={categories}
                />

                <SelectField
                  label="Difficulty"
                  value={form.difficulty}
                  onChange={(value) => updateForm("difficulty", value)}
                  options={difficulties}
                />

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-[#6f7278]">
                    Points
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.points}
                    onChange={(event) =>
                      updateForm("points", event.target.value)
                    }
                    required
                    className="h-10 w-full rounded-[5px] border border-[#dedede] px-3 text-sm outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#eeeeee] pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingQuestion(null);
                    resetForm();
                  }}
                  className="h-10 rounded-[5px] border border-[#dedede] px-4 text-sm font-semibold text-[#45484d] hover:bg-[#fafafa]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 min-w-[125px] items-center justify-center gap-2 rounded-[5px] bg-[#ff6b00] px-4 text-sm font-semibold text-white hover:bg-[#e85f00] disabled:opacity-60"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving
                    ? editingQuestion
                      ? "Saving..."
                      : "Creating..."
                    : editingQuestion
                      ? "Save Changes"
                      : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteQuestion && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-question-title"
        >
          <div className="w-full max-w-[440px] overflow-hidden rounded-[8px] border border-[#e8e8e8] bg-white shadow-2xl">
            <div className="flex items-start justify-between px-6 pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1f1]">
                <AlertTriangle
                  size={21}
                  className="text-[#d92d20]"
                />
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingId)}
                className="rounded-full p-1.5 text-[#6f7278] transition hover:bg-[#f3f3f3] hover:text-[#121212] disabled:opacity-40"
                aria-label="Close delete confirmation"
              >
                <X size={19} />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4">
              <h2
                id="delete-question-title"
                className="text-[18px] font-bold text-[#121212]"
              >
                Delete Question?
              </h2>

              <p className="mt-2 text-sm leading-5 text-[#6f7278]">
                Are you sure you want to delete this question? This action
                cannot be undone.
              </p>

              <div className="mt-4 rounded-[5px] border border-[#eeeeee] bg-[#fafafa] px-3.5 py-3">
                <p className="line-clamp-3 text-xs font-medium leading-5 text-[#45484d]">
                  {deleteQuestion.question}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={Boolean(deletingId)}
                  className="h-10 rounded-[5px] border border-[#dedede] px-4 text-sm font-semibold text-[#45484d] transition hover:bg-[#fafafa] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={Boolean(deletingId)}
                  className="inline-flex h-10 min-w-[125px] items-center justify-center gap-2 rounded-[5px] bg-[#d92d20] px-4 text-sm font-semibold text-white transition hover:bg-[#b42318] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Delete Question
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bulkAction === "DELETE" && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-title"
        >
          <div className="w-full max-w-[460px] overflow-hidden rounded-[8px] border border-[#e8e8e8] bg-white shadow-2xl">
            <div className="flex items-start justify-between px-6 pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1f1]">
                <AlertTriangle size={21} className="text-[#d92d20]" />
              </div>

              <button
                type="button"
                onClick={closeBulkDeleteModal}
                disabled={bulkProcessing}
                className="rounded-full p-1.5 text-[#6f7278] transition hover:bg-[#f3f3f3] hover:text-[#121212] disabled:opacity-40"
                aria-label="Close bulk delete confirmation"
              >
                <X size={19} />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4">
              <h2
                id="bulk-delete-title"
                className="text-[18px] font-bold text-[#121212]"
              >
                Delete {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "Question" : "Questions"}?
              </h2>

              <p className="mt-2 text-sm leading-5 text-[#6f7278]">
                You are about to permanently delete the selected questions.
                This action cannot be undone.
              </p>

              <div className="mt-4 max-h-[150px] space-y-2 overflow-y-auto rounded-[5px] border border-[#eeeeee] bg-[#fafafa] p-3">
                {getSelectedQuestions().map((question) => (
                  <p
                    key={question.id}
                    className="text-xs font-medium leading-5 text-[#45484d]"
                  >
                    • {question.question}
                  </p>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeBulkDeleteModal}
                  disabled={bulkProcessing}
                  className="h-10 rounded-[5px] border border-[#dedede] px-4 text-sm font-semibold text-[#45484d] transition hover:bg-[#fafafa] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleBulkDelete()}
                  disabled={bulkProcessing}
                  className="inline-flex h-10 min-w-[135px] items-center justify-center gap-2 rounded-[5px] bg-[#d92d20] px-4 text-sm font-semibold text-white transition hover:bg-[#b42318] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkProcessing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Mass Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-[#6f7278]">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-[5px] border border-[#dedede] bg-white px-3 pr-9 text-sm outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/10"
        >
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6f7278]"
        />
      </div>
    </div>
  );
}
