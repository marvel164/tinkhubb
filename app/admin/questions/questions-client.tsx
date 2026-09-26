"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { DragEvent, useEffect, useMemo, useRef, useState } from "react";

type Question = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  category: string;
  difficulty: string;
  points: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt?: string;
};

type FormState = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  category: string;
  difficulty: string;
  points: string;
  status: "ACTIVE" | "INACTIVE";
};

type ImportError = {
  row: number;
  message: string;
};

type PreviewRow = {
  question: string;
  category: string;
  difficulty: string;
  correctOption: string;
  points: number;
  status: string;
};

type ImportPreview = {
  filename: string;
  totalRows: number;
  validRows: number;
  skippedDuplicates: number;
  errorCount: number;
  errors: ImportError[];
  previewRows: PreviewRow[];
  canImport: boolean;
};

const EMPTY_FORM: FormState = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  category: "GENERAL_KNOWLEDGE",
  difficulty: "MEDIUM",
  points: "1",
  status: "ACTIVE",
};

const CATEGORY_OPTIONS = [
  { value: "GENERAL_KNOWLEDGE", label: "General Knowledge" },
  { value: "SCIENCE", label: "Science" },
  { value: "HISTORY", label: "History" },
  { value: "SPORTS", label: "Sports" },
  { value: "GEOGRAPHY", label: "Geography" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "BUSINESS", label: "Business" },
  { value: "CURRENT_AFFAIRS", label: "Current Affairs" },
];

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const PAGE_SIZE = 10;

function categoryLabel(value: string) {
  return (
    CATEGORY_OPTIONS.find((item) => item.value === value)?.label ??
    value.replaceAll("_", " ")
  );
}

function difficultyLabel(value: string) {
  return (
    DIFFICULTY_OPTIONS.find((item) => item.value === value)?.label ?? value
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusBadge(status: string) {
  return status === "ACTIVE"
    ? "bg-[#e9f8ef] text-[#16834a] dark:bg-[#173b2a] dark:text-[#62d996]"
    : "bg-[#f1f1f1] text-[#777] dark:bg-[#292421] dark:text-[#aaa098]";
}

function isSupportedFile(file: File) {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";

  return ["csv", "xlsx", "xls"].includes(extension);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function QuestionsClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(60);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "ACTIVATE" | "DEACTIVATE" | "DELETE" | null
  >(null);
  const [bulkError, setBulkError] = useState("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [draggingFile, setDraggingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [page, setPage] = useState(1);

  async function loadQuestions() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/questions?status=ALL&sort=asc", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to load questions.",
        );
      }

      setQuestions(Array.isArray(data?.data) ? data.data : []);

      setTimerSeconds(
        typeof data?.timerSeconds === "number" && data.timerSeconds > 0
          ? data.timerSeconds
          : 60,
      );
    } catch (error) {
      console.error(error);
      setQuestions([]);
      setTimerSeconds(60);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusTab, categoryFilter, difficultyFilter, sortOrder]);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = questions.filter((item) => {
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        categoryLabel(item.category).toLowerCase().includes(query);

      const matchesStatus = statusTab === "ALL" || item.status === statusTab;

      const matchesCategory =
        categoryFilter === "ALL" || item.category === categoryFilter;

      const matchesDifficulty =
        difficultyFilter === "ALL" || item.difficulty === difficultyFilter;

      return (
        matchesSearch && matchesStatus && matchesCategory && matchesDifficulty
      );
    });

    result.sort((a, b) => {
      const comparison = a.question.localeCompare(b.question, undefined, {
        sensitivity: "base",
      });

      return sortOrder === "ASC" ? comparison : -comparison;
    });

    return result;
  }, [
    questions,
    search,
    statusTab,
    categoryFilter,
    difficultyFilter,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / PAGE_SIZE),
  );

  const paginatedQuestions = filteredQuestions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const totalQuestions = questions.length;

  const activeQuestions = questions.filter(
    (item) => item.status === "ACTIVE",
  ).length;

  const inactiveQuestions = questions.filter(
    (item) => item.status === "INACTIVE",
  ).length;

  const categoryCount = new Set(questions.map((item) => item.category)).size;

  const allVisibleSelected =
    paginatedQuestions.length > 0 &&
    paginatedQuestions.every((item) => selectedIds.includes(item.id));

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = paginatedQuestions.map((item) => item.id);

    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );
    } else {
      setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);
    }
  }

  function openCreateModal() {
    setEditingQuestion(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowQuestionModal(true);
  }

  function openPreviewModal(question: Question) {
    setPreviewQuestion(question);
    setOpenMenuId(null);
    setShowPreviewModal(true);
  }

  function openEditModal(question: Question) {
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
      status: question.status,
    });

    setFormError("");
    setOpenMenuId(null);
    setShowQuestionModal(true);
  }

  async function saveQuestion() {
    setFormError("");

    if (
      !form.question.trim() ||
      !form.optionA.trim() ||
      !form.optionB.trim() ||
      !form.optionC.trim() ||
      !form.optionD.trim()
    ) {
      setFormError("Please complete the question and all four options.");
      return;
    }

    const points = Number(form.points);

    if (!Number.isInteger(points) || points < 0 || points > 100) {
      setFormError("Points must be a whole number between 0 and 100.");
      return;
    }

    const options = [
      form.optionA.trim(),
      form.optionB.trim(),
      form.optionC.trim(),
      form.optionD.trim(),
    ].map((option) => option.replace(/\s+/g, " ").toLowerCase());

    if (new Set(options).size !== options.length) {
      setFormError("Each answer option must be different.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        question: form.question.trim(),
        optionA: form.optionA.trim(),
        optionB: form.optionB.trim(),
        optionC: form.optionC.trim(),
        optionD: form.optionD.trim(),
        correctOption: form.correctOption,
        category: form.category,
        difficulty: form.difficulty,
        points,
        status: form.status,
      };

      const response = await fetch(
        editingQuestion
          ? `/api/admin/questions/${editingQuestion.id}`
          : "/api/admin/questions",
        {
          method: editingQuestion ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Unable to save question.",
        );
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);
      setForm(EMPTY_FORM);

      await loadQuestions();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save question.",
      );
    } finally {
      setSaving(false);
    }
  }

  function askDelete(question: Question) {
    setDeleteTarget(question);
    setDeleteError("");
    setOpenMenuId(null);
    setShowDeleteModal(true);
  }

  async function deleteQuestion() {
    if (!deleteTarget) return;

    setDeleteError("");

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/questions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Unable to delete question.",
        );
      }

      setQuestions((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );

      setSelectedIds((current) =>
        current.filter((id) => id !== deleteTarget.id),
      );

      setDeleteTarget(null);
      setShowDeleteModal(false);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Unable to delete question.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function runBulkAction() {
    if (!bulkAction || selectedIds.length === 0) {
      return;
    }

    setBulkError("");

    try {
      setSaving(true);

      const response = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: bulkAction,
          questionIds: selectedIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Bulk action failed.");
      }

      setSelectedIds([]);
      setBulkAction(null);
      setShowBulkDeleteModal(false);

      await loadQuestions();
    } catch (error) {
      setBulkError(
        error instanceof Error ? error.message : "Bulk action failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  function requestBulkAction(action: "ACTIVATE" | "DEACTIVATE" | "DELETE") {
    if (selectedIds.length === 0) {
      return;
    }

    setBulkError("");
    setBulkAction(action);

    if (action === "DELETE") {
      setShowBulkDeleteModal(true);
    } else {
      void runBulkAction();
    }
  }

  function resetImportState() {
    setImportFile(null);
    setPreview(null);
    setImportError("");
    setImportSuccess("");
    setPreviewing(false);
    setImporting(false);
    setDraggingFile(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function closeImportModal() {
    if (previewing || importing) {
      return;
    }

    setShowImportModal(false);
    resetImportState();
  }

  function selectImportFile(file: File | null) {
    setImportError("");
    setImportSuccess("");
    setPreview(null);

    if (!file) {
      setImportFile(null);
      return;
    }

    if (!isSupportedFile(file)) {
      setImportFile(null);
      setImportError("Please upload a CSV, XLSX, or XLS file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImportFile(null);
      setImportError("The selected file is larger than 5 MB.");
      return;
    }

    setImportFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    setDraggingFile(false);

    const file = event.dataTransfer.files?.[0] ?? null;

    selectImportFile(file);
  }

  async function previewImport() {
    setImportError("");
    setImportSuccess("");
    setPreview(null);

    if (!importFile) {
      setImportError("Please select a CSV or Excel file first.");
      return;
    }

    try {
      setPreviewing(true);

      const formData = new FormData();

      formData.append("file", importFile);
      formData.append("preview", "true");

      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const details = Array.isArray(data?.errors)
          ? data.errors
              .slice(0, 5)
              .map((item: ImportError) =>
                item.row > 0
                  ? `Row ${item.row}: ${item.message}`
                  : item.message,
              )
              .join(" ")
          : "";

        throw new Error(
          `${data?.message || "Preview failed."}${
            details ? ` ${details}` : ""
          }`,
        );
      }

      const totalRows =
        typeof data?.totalRows === "number" ? data.totalRows : 0;

      const validRows =
        typeof data?.validRows === "number" ? data.validRows : 0;

      const duplicateRows =
        typeof data?.duplicateRows === "number" ? data.duplicateRows : 0;

      const errorCount =
        typeof data?.errorCount === "number" ? data.errorCount : 0;

      const errors: ImportError[] = Array.isArray(data?.errors)
        ? data.errors
        : [];

      setPreview({
        filename: data?.filename ?? importFile.name,
        totalRows,
        validRows,
        skippedDuplicates: duplicateRows,
        errorCount,
        errors,
        previewRows: Array.isArray(data?.previewRows) ? data.previewRows : [],
        canImport: errorCount === 0 && validRows > 0,
      });
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unable to preview the file.",
      );
    } finally {
      setPreviewing(false);
    }
  }

  async function importQuestions() {
    setImportError("");
    setImportSuccess("");

    if (!importFile) {
      setImportError("Please select a CSV or Excel file.");
      return;
    }

    if (!preview?.canImport) {
      setImportError("Please preview a valid file before importing.");
      return;
    }

    try {
      setImporting(true);

      const formData = new FormData();

      formData.append("file", importFile);
      formData.append("preview", "false");

      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const details = Array.isArray(data?.errors)
          ? data.errors
              .slice(0, 5)
              .map((item: ImportError) =>
                item.row > 0
                  ? `Row ${item.row}: ${item.message}`
                  : item.message,
              )
              .join(" ")
          : "";

        throw new Error(
          `${data?.message || "Import failed."}${details ? ` ${details}` : ""}`,
        );
      }

      const imported = typeof data?.imported === "number" ? data.imported : 0;

      setImportSuccess(
        `${imported} question${
          imported === 1 ? "" : "s"
        } imported successfully.`,
      );

      setPreview(null);
      setImportFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadQuestions();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      className="min-h-full bg-[#f5f6f8] px-4 py-6 text-[#171717] transition-colors dark:bg-[#15120f] dark:text-[#fff4ec] sm:px-6 lg:px-8"
      onClick={() => setOpenMenuId(null)}
    >
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.5px]">
              Question Management
            </h1>

            <p className="mt-1 text-sm text-[#777b80] dark:text-[#aaa098]">
              Create, manage and organize trivia questions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                setShowImportModal(true);
                resetImportState();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-[5px] border border-[#ff6b00] bg-transparent px-5 text-sm font-semibold text-[#ff6b00] transition hover:bg-[#fff0e5] dark:hover:bg-[#3a2418]"
            >
              <Upload size={17} />
              Bulk Upload
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openCreateModal();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-[5px] bg-[#ff6b00] px-5 text-sm font-semibold text-white transition hover:bg-[#e85f00]"
            >
              <Plus size={18} />
              Add Question
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Questions",
              value: totalQuestions,
            },
            {
              label: "Active Questions",
              value: activeQuestions,
            },
            {
              label: "Inactive Questions",
              value: inactiveQuestions,
            },
            {
              label: "Categories",
              value: categoryCount,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-[6px] border border-[#e6e7e9] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-[#342a24] dark:bg-[#1b1714]"
            >
              <p className="text-sm text-[#777b80] dark:text-[#aaa098]">
                {metric.label}
              </p>

              <p className="mt-3 text-[28px] font-semibold">
                {metric.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-[6px] border border-[#e6e7e9] bg-white dark:border-[#342a24] dark:bg-[#1b1714]">
          {/* Tabs */}
          <div className="border-b border-[#eeeeef] px-5 dark:border-[#342a24]">
            <div className="flex gap-7 overflow-x-auto">
              {[
                {
                  value: "ALL",
                  label: "All",
                },
                {
                  value: "ACTIVE",
                  label: "Active",
                },
                {
                  value: "INACTIVE",
                  label: "Inactive",
                },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setStatusTab(tab.value as "ALL" | "ACTIVE" | "INACTIVE")
                  }
                  className={`relative whitespace-nowrap py-4 text-sm font-medium transition ${
                    statusTab === tab.value
                      ? "text-[#ff6b00]"
                      : "text-[#777b80] hover:text-[#272727] dark:text-[#aaa098] dark:hover:text-white"
                  }`}
                >
                  {tab.label}

                  {statusTab === tab.value && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#ff6b00]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-[#eeeeef] p-5 dark:border-[#342a24] xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[400px]">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b9da1]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions"
                className="h-11 w-full rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] pl-10 pr-4 text-sm text-[#272727] outline-none transition placeholder:text-[#9b9da1] focus:border-[#ff6b00] dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white dark:placeholder:text-[#82776f]"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Filter
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#888]"
                />

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-11 appearance-none rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] pl-9 pr-9 text-sm text-[#272727] outline-none dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                >
                  <option value="ALL">All Categories</option>

                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#888]"
                />
              </div>

              <div className="relative">
                <select
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value)}
                  className="h-11 appearance-none rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-4 pr-9 text-sm text-[#272727] outline-none dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                >
                  <option value="ALL">All Difficulties</option>

                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <option key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#888]"
                />
              </div>

              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "ASC" | "DESC")
                  }
                  className="h-11 appearance-none rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-4 pr-9 text-sm text-[#272727] outline-none dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                >
                  <option value="ASC">A–Z</option>
                  <option value="DESC">Z–A</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#888]"
                />
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div
              className="flex flex-col gap-3 border-b border-[#eeeeef] bg-[#fff8f3] px-5 py-3 dark:border-[#342a24] dark:bg-[#261a13] sm:flex-row sm:items-center sm:justify-between"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-sm font-medium">
                {selectedIds.length} question
                {selectedIds.length === 1 ? "" : "s"} selected
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => requestBulkAction("ACTIVATE")}
                  className="rounded-[5px] border border-[#d8e8dd] bg-white px-3 py-2 text-xs font-semibold text-[#16834a] dark:border-[#285338] dark:bg-[#1b1714] dark:text-[#62d996]"
                >
                  Activate
                </button>

                <button
                  type="button"
                  onClick={() => requestBulkAction("DEACTIVATE")}
                  className="rounded-[5px] border border-[#ddd] bg-white px-3 py-2 text-xs font-semibold text-[#666] dark:border-[#3a302a] dark:bg-[#1b1714] dark:text-[#aaa098]"
                >
                  Deactivate
                </button>

                <button
                  type="button"
                  onClick={() => requestBulkAction("DELETE")}
                  className="rounded-[5px] border border-[#f0d2d2] bg-white px-3 py-2 text-xs font-semibold text-[#d92d20] dark:border-[#522626] dark:bg-[#1b1714] dark:text-[#ff8585]"
                >
                  Mass Delete
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-[#eeeeef] bg-[#fafafa] text-xs font-semibold uppercase tracking-wide text-[#777b80] dark:border-[#342a24] dark:bg-[#211c18] dark:text-[#82776f]">
                  <th className="w-12 px-5 py-4">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="h-4 w-4 accent-[#ff6b00]"
                    />
                  </th>

                  <th className="px-3 py-4">Question</th>
                  <th className="px-3 py-4">Date Created</th>
                  <th className="px-3 py-4">Category</th>
                  <th className="px-3 py-4">Timer</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="w-16 px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Loader2
                        size={24}
                        className="mx-auto animate-spin text-[#ff6b00]"
                      />

                      <p className="mt-3 text-sm text-[#777b80] dark:text-[#aaa098]">
                        Loading questions...
                      </p>
                    </td>
                  </tr>
                ) : paginatedQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0e5] text-[#ff6b00] dark:bg-[#3a2418]">
                        <Search size={19} />
                      </div>

                      <p className="mt-3 text-sm font-semibold">
                        No questions found
                      </p>

                      <p className="mt-1 text-sm text-[#777b80] dark:text-[#aaa098]">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedQuestions.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#eeeeef] last:border-0 hover:bg-[#fafafa] dark:border-[#342a24] dark:hover:bg-[#211c18]"
                    >
                      <td className="px-5 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                          className="h-4 w-4 accent-[#ff6b00]"
                        />
                      </td>

                      <td className="max-w-[440px] px-3 py-4 align-top">
                        <p className="line-clamp-2 text-sm font-medium leading-6">
                          {item.question}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 align-top text-sm text-[#666] dark:text-[#aaa098]">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-3 py-4 align-top">
                        <span className="text-sm text-[#555] dark:text-[#bdb0a8]">
                          {categoryLabel(item.category)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 align-top text-sm text-[#555] dark:text-[#bdb0a8]">
                        {timerSeconds} sec
                      </td>

                      <td className="px-3 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                            item.status,
                          )}`}
                        >
                          {item.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="relative px-5 py-4 text-right align-top">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setOpenMenuId((current) =>
                              current === item.id ? null : item.id,
                            );
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#777b80] transition hover:bg-[#f5f5f5] hover:text-[#222] dark:text-[#a89b94] dark:hover:bg-[#29201b] dark:hover:text-white"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenuId === item.id && (
                          <div
                            className="absolute right-5 top-12 z-20 w-40 overflow-hidden rounded-[5px] border border-[#e6e7e9] bg-white py-1 text-left shadow-xl dark:border-[#3a302a] dark:bg-[#211c18]"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openPreviewModal(item)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-[#f7f7f7] dark:hover:bg-[#29201b]"
                            >
                              <Eye size={15} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-[#f7f7f7] dark:hover:bg-[#29201b]"
                            >
                              <Edit3 size={15} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => askDelete(item)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#d92d20] hover:bg-[#fff5f5] dark:text-[#ff8585] dark:hover:bg-[#321d1d]"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-[#eeeeef] px-5 py-4 dark:border-[#342a24] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#777b80] dark:text-[#aaa098]">
              Showing{" "}
              <span className="font-medium text-[#333] dark:text-white">
                {filteredQuestions.length === 0
                  ? 0
                  : (page - 1) * PAGE_SIZE + 1}
                –{Math.min(page * PAGE_SIZE, filteredQuestions.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#333] dark:text-white">
                {filteredQuestions.length}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] border border-[#e7e7e8] text-[#777b80] transition hover:bg-[#f5f5f5] disabled:opacity-40 dark:border-[#3a302a] dark:text-[#aaa098] dark:hover:bg-[#29201b]"
              >
                <ChevronLeft size={17} />
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) => index + 1,
              )
                .slice(
                  Math.max(0, Math.min(page - 2, totalPages - 3)),
                  Math.max(3, Math.min(page + 1, totalPages)),
                )
                .map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    className={`h-9 min-w-9 rounded-[5px] px-2 text-sm font-medium ${
                      page === number
                        ? "bg-[#ff6b00] text-white"
                        : "border border-[#e7e7e8] text-[#666] hover:bg-[#f7f7f7] dark:border-[#3a302a] dark:text-[#aaa098] dark:hover:bg-[#29201b]"
                    }`}
                  >
                    {number}
                  </button>
                ))}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] border border-[#e7e7e8] text-[#777b80] transition hover:bg-[#f5f5f5] disabled:opacity-40 dark:border-[#3a302a] dark:text-[#aaa098] dark:hover:bg-[#29201b]"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Preview Modal */}
      {showPreviewModal && previewQuestion && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[8px] border border-[#e6e7e9] bg-white p-6 shadow-2xl dark:border-[#3a302a] dark:bg-[#1b1714]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Question Preview</h2>

                <p className="mt-1 text-sm text-[#777b80] dark:text-[#aaa098]">
                  View the complete question and its current settings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-lg p-2 text-[#777b80] hover:bg-[#f2f2f2] dark:text-[#a89b94] dark:hover:bg-[#29201b]"
                aria-label="Close question preview"
              >
                <X size={19} />
              </button>
            </div>

            {/* Question */}
            <div className="rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-5 dark:border-[#342a24] dark:bg-[#211c18]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a8d91]">
                  Question
                </p>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                    previewQuestion.status,
                  )}`}
                >
                  {previewQuestion.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-base font-semibold leading-7">
                {previewQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold">Answer Options</p>

              <div className="space-y-3">
                {[
                  {
                    letter: "A",
                    value: previewQuestion.optionA,
                  },
                  {
                    letter: "B",
                    value: previewQuestion.optionB,
                  },
                  {
                    letter: "C",
                    value: previewQuestion.optionC,
                  },
                  {
                    letter: "D",
                    value: previewQuestion.optionD,
                  },
                ].map((option) => {
                  const isCorrect =
                    previewQuestion.correctOption === option.letter;

                  return (
                    <div
                      key={option.letter}
                      className={`flex items-start gap-3 rounded-[6px] border p-3.5 ${
                        isCorrect
                          ? "border-[#bfe3cc] bg-[#f1fbf4] dark:border-[#285338] dark:bg-[#173b2a]"
                          : "border-[#e7e7e8] bg-white dark:border-[#342a24] dark:bg-[#211c18]"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCorrect
                            ? "bg-[#16834a] text-white dark:bg-[#62d996] dark:text-[#173b2a]"
                            : "bg-[#f1f1f1] text-[#666] dark:bg-[#292421] dark:text-[#aaa098]"
                        }`}
                      >
                        {option.letter}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6">{option.value}</p>

                        {isCorrect && (
                          <p className="mt-1 text-xs font-semibold text-[#16834a] dark:text-[#62d996]">
                            Correct answer
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question metadata */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-3 dark:border-[#342a24] dark:bg-[#211c18]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8d91]">
                  Category
                </p>

                <p className="mt-1 text-sm font-medium">
                  {categoryLabel(previewQuestion.category)}
                </p>
              </div>

              <div className="rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-3 dark:border-[#342a24] dark:bg-[#211c18]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8d91]">
                  Difficulty
                </p>

                <p className="mt-1 text-sm font-medium">
                  {difficultyLabel(previewQuestion.difficulty)}
                </p>
              </div>

              <div className="rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-3 dark:border-[#342a24] dark:bg-[#211c18]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8d91]">
                  Timer
                </p>

                <p className="mt-1 text-sm font-medium">
                  {timerSeconds} seconds
                </p>
              </div>

              <div className="rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-3 dark:border-[#342a24] dark:bg-[#211c18]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8d91]">
                  Points
                </p>

                <p className="mt-1 text-sm font-medium">
                  {previewQuestion.points}
                </p>
              </div>
            </div>

            {/* Created date */}
            <div className="mt-3 rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-3 dark:border-[#342a24] dark:bg-[#211c18]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8d91]">
                Date Created
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatDate(previewQuestion.createdAt)}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="h-11 rounded-[5px] border border-[#e7e7e8] px-5 text-sm font-semibold text-[#555] dark:border-[#3a302a] dark:text-[#d7cbc4]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[8px] border border-[#e6e7e9] bg-white p-6 shadow-2xl dark:border-[#3a302a] dark:bg-[#1b1714]">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </h2>

                <p className="mt-1 text-sm text-[#777b80] dark:text-[#aaa098]">
                  {editingQuestion
                    ? "Update the question details below."
                    : "Create a new trivia question."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="rounded-lg p-2 text-[#777b80] hover:bg-[#f2f2f2] dark:text-[#a89b94] dark:hover:bg-[#29201b]"
              >
                <X size={19} />
              </button>
            </div>

            {formError && (
              <div className="mb-5 flex gap-3 rounded-[5px] border border-[#f2caca] bg-[#fff5f5] p-3 text-sm text-[#c62828] dark:border-[#5b2b2b] dark:bg-[#321d1d] dark:text-[#ff8585]">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Question
                </label>

                <textarea
                  value={form.question}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      question: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Enter question"
                  className="w-full resize-none rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-3 py-3 text-sm text-[#272727] outline-none focus:border-[#ff6b00] dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["A", "optionA"],
                  ["B", "optionB"],
                  ["C", "optionC"],
                  ["D", "optionD"],
                ].map(([letter, field]) => (
                  <div key={field}>
                    <label className="mb-2 block text-sm font-medium">
                      Option {letter}
                    </label>

                    <input
                      value={form[field as keyof FormState] as string}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field]: event.target.value,
                        }))
                      }
                      placeholder={`Option ${letter}`}
                      className="h-11 w-full rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-3 text-sm text-[#272727] outline-none focus:border-[#ff6b00] dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Correct Answer
                  </label>

                  <select
                    value={form.correctOption}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        correctOption: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-3 text-sm text-[#272727] outline-none dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-3 text-sm text-[#272727] outline-none dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Difficulty
                  </label>

                  <select
                    value={form.difficulty}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        difficulty: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-3 text-sm text-[#272727] outline-none dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                  >
                    {DIFFICULTY_OPTIONS.map((difficulty) => (
                      <option key={difficulty.value} value={difficulty.value}>
                        {difficulty.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Points
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.points}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        points: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-3 text-sm text-[#272727] outline-none focus:border-[#ff6b00] dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as "ACTIVE" | "INACTIVE",
                    }))
                  }
                  className="h-11 w-full rounded-[5px] border border-[#e7e7e8] bg-[#fafafa] px-3 text-sm text-[#272727] outline-none dark:border-[#3a302a] dark:bg-[#211c18] dark:text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="rounded-[5px] border border-[#eeeeef] bg-[#fafafa] p-3 dark:border-[#342a24] dark:bg-[#211c18]">
                <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#8a8d91]">
                  Timer per question
                </p>

                <p className="mt-1 text-[12px] font-semibold">
                  {timerSeconds} seconds
                </p>

                <p className="mt-1 text-[9px] leading-4 text-[#8a8d91]">
                  Calculated automatically from the global game settings.
                </p>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="h-11 rounded-[5px] border border-[#e7e7e8] px-5 text-sm font-semibold text-[#555] dark:border-[#3a302a] dark:text-[#d7cbc4]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={saveQuestion}
                className="inline-flex h-11 items-center gap-2 rounded-[5px] bg-[#ff6b00] px-6 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}

                {editingQuestion ? "Save Changes" : "Add Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[8px] border border-[#e6e7e9] bg-white p-6 shadow-2xl dark:border-[#3a302a] dark:bg-[#1b1714]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f0] text-[#d92d20] dark:bg-[#421e1e] dark:text-[#ff8585]">
              <Trash2 size={19} />
            </div>

            <h2 className="mt-5 text-xl font-semibold">Delete question?</h2>

            <p className="mt-2 text-sm leading-6 text-[#777b80] dark:text-[#aaa098]">
              This action cannot be undone. The selected question will be
              permanently removed.
            </p>

            <div className="mt-4 rounded-[5px] bg-[#f7f7f7] p-3 text-sm dark:bg-[#211c18]">
              {deleteTarget.question}
            </div>

            {deleteError && (
              <div className="mt-4 flex gap-3 rounded-[5px] border border-[#f2caca] bg-[#fff5f5] p-3 text-sm text-[#c62828] dark:border-[#5b2b2b] dark:bg-[#321d1d] dark:text-[#ff8585]">
                <XCircle size={18} className="mt-0.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="h-11 rounded-[5px] border border-[#e7e7e8] px-5 text-sm font-semibold dark:border-[#3a302a]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={deleteQuestion}
                className="inline-flex h-11 items-center gap-2 rounded-[5px] bg-[#d92d20] px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[8px] border border-[#e6e7e9] bg-white p-6 shadow-2xl dark:border-[#3a302a] dark:bg-[#1b1714]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f0] text-[#d92d20] dark:bg-[#421e1e] dark:text-[#ff8585]">
              <AlertTriangle size={20} />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Mass delete questions?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#777b80] dark:text-[#aaa098]">
              You are about to permanently delete{" "}
              <strong className="text-[#222] dark:text-white">
                {selectedIds.length}
              </strong>{" "}
              question
              {selectedIds.length === 1 ? "" : "s"}. This cannot be undone.
            </p>

            {bulkError && (
              <div className="mt-4 flex gap-3 rounded-[5px] border border-[#f2caca] bg-[#fff5f5] p-3 text-sm text-[#c62828] dark:border-[#5b2b2b] dark:bg-[#321d1d] dark:text-[#ff8585]">
                <XCircle size={18} className="mt-0.5 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  setBulkError("");
                }}
                className="h-11 rounded-[5px] border border-[#e7e7e8] px-5 text-sm font-semibold dark:border-[#3a302a]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={runBulkAction}
                className="inline-flex h-11 items-center gap-2 rounded-[5px] bg-[#d92d20] px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Delete Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[8px] border border-[#e6e7e9] bg-white p-6 shadow-2xl dark:border-[#3a302a] dark:bg-[#1b1714]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Bulk Import</h2>

                <p className="mt-1 text-sm text-[#777b80] dark:text-[#aaa098]">
                  Upload a CSV or Excel file, preview the questions, then import
                  them.
                </p>
              </div>

              <button
                type="button"
                disabled={previewing || importing}
                onClick={closeImportModal}
                className="rounded-lg p-2 text-[#777b80] hover:bg-[#f2f2f2] disabled:opacity-40 dark:text-[#a89b94] dark:hover:bg-[#29201b]"
              >
                <X size={19} />
              </button>
            </div>

            {!preview && (
              <>
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDraggingFile(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDraggingFile(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDraggingFile(false);
                  }}
                  onDrop={handleDrop}
                  className={`mt-6 rounded-xl border border-dashed p-8 text-center transition ${
                    draggingFile
                      ? "border-[#ff6b00] bg-[#fff5ed] dark:bg-[#3a2418]"
                      : "border-[#d8d8d8] bg-[#fafafa] dark:border-[#3a302a] dark:bg-[#211c18]"
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e5] text-[#ff6b00] dark:bg-[#3a2418]">
                    <FileSpreadsheet size={23} />
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Drag and drop your file here
                  </p>

                  <p className="mt-1 text-xs text-[#777b80] dark:text-[#aaa098]">
                    or choose a file from your computer
                  </p>

                  <label className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-[5px] bg-[#ff6b00] px-5 text-sm font-semibold text-white">
                    Choose File
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      className="hidden"
                      onChange={(event) =>
                        selectImportFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>

                  <p className="mt-4 text-[11px] text-[#8a8d91]">
                    CSV, XLSX or XLS • Maximum 5 MB
                  </p>
                </div>

                {importFile && (
                  <div className="mt-4 flex items-center justify-between rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-4 dark:border-[#342a24] dark:bg-[#211c18]">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#fff0e5] text-[#ff6b00] dark:bg-[#3a2418]">
                        <FileSpreadsheet size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {importFile.name}
                        </p>

                        <p className="mt-0.5 text-xs text-[#888]">
                          {formatBytes(importFile.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setImportFile(null);
                        setImportError("");

                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="rounded-lg p-2 text-[#777b80] hover:bg-[#eeeeee] dark:hover:bg-[#29201b]"
                    >
                      <X size={17} />
                    </button>
                  </div>
                )}

                <div className="mt-5 rounded-[5px] border border-[#eeeeef] bg-[#fafafa] p-4 dark:border-[#342a24] dark:bg-[#211c18]">
                  <p className="text-sm font-semibold">Required columns</p>

                  <p className="mt-2 text-xs leading-6 text-[#777b80] dark:text-[#aaa098]">
                    question, optionA, optionB, optionC, optionD, correctOption,
                    category, difficulty, points, status
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#8a8d91]">
                    Timer is controlled automatically by the global game
                    settings and should not be included in the import file.
                  </p>
                </div>
              </>
            )}

            {preview && (
              <div className="mt-6">
                <div className="flex items-start gap-3 rounded-[6px] border border-[#cbe8d5] bg-[#f1fbf4] p-4 dark:border-[#285338] dark:bg-[#173b2a]">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-[#16834a] dark:text-[#62d996]"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#16834a] dark:text-[#62d996]">
                      File preview complete
                    </p>

                    <p className="mt-1 truncate text-xs text-[#4c6655] dark:text-[#9bc9aa]">
                      {preview.filename}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Rows",
                      value: preview.totalRows,
                    },
                    {
                      label: "Valid",
                      value: preview.validRows,
                    },
                    {
                      label: "Duplicates",
                      value: preview.skippedDuplicates,
                    },
                    {
                      label: "Errors",
                      value: preview.errorCount,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[6px] border border-[#e7e7e8] bg-[#fafafa] p-3 dark:border-[#342a24] dark:bg-[#211c18]"
                    >
                      <p className="text-[11px] text-[#888]">{item.label}</p>

                      <p className="mt-1 text-lg font-semibold">
                        {item.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {preview.errors.length > 0 && (
                  <div className="mt-5 overflow-hidden rounded-[6px] border border-[#f2caca] bg-[#fff8f8] dark:border-[#5b2b2b] dark:bg-[#321d1d]">
                    <div className="flex items-center gap-2 border-b border-[#f2dede] px-4 py-3 dark:border-[#5b2b2b]">
                      <AlertTriangle
                        size={17}
                        className="text-[#d92d20] dark:text-[#ff8585]"
                      />

                      <p className="text-sm font-semibold text-[#c62828] dark:text-[#ff8585]">
                        Import errors
                      </p>
                    </div>

                    <div className="max-h-48 overflow-y-auto p-4">
                      <div className="space-y-2">
                        {preview.errors.map((error, index) => (
                          <div
                            key={`${error.row}-${index}`}
                            className="text-xs leading-5 text-[#7b3434] dark:text-[#f2aaaa]"
                          >
                            {error.row > 0 ? (
                              <span className="font-semibold">
                                Row {error.row}:{" "}
                              </span>
                            ) : null}

                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {preview.previewRows.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Preview</p>

                      <p className="text-[11px] text-[#888]">
                        First {preview.previewRows.length} valid rows
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-[6px] border border-[#e7e7e8] dark:border-[#342a24]">
                      <table className="w-full min-w-[620px] text-left">
                        <thead>
                          <tr className="border-b border-[#e7e7e8] bg-[#fafafa] text-[10px] font-semibold uppercase tracking-wide text-[#777b80] dark:border-[#342a24] dark:bg-[#211c18] dark:text-[#82776f]">
                            <th className="px-3 py-3">Question</th>
                            <th className="px-3 py-3">Category</th>
                            <th className="px-3 py-3">Difficulty</th>
                            <th className="px-3 py-3">Answer</th>
                            <th className="px-3 py-3">Points</th>
                            <th className="px-3 py-3">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {preview.previewRows.map((row, index) => (
                            <tr
                              key={index}
                              className="border-b border-[#eeeeef] last:border-0 dark:border-[#342a24]"
                            >
                              <td className="max-w-[260px] px-3 py-3">
                                <p className="line-clamp-2 text-xs font-medium leading-5">
                                  {row.question}
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-3 py-3 text-xs text-[#666] dark:text-[#aaa098]">
                                {categoryLabel(row.category)}
                              </td>

                              <td className="whitespace-nowrap px-3 py-3 text-xs text-[#666] dark:text-[#aaa098]">
                                {difficultyLabel(row.difficulty)}
                              </td>

                              <td className="px-3 py-3 text-xs font-semibold">
                                {row.correctOption}
                              </td>

                              <td className="px-3 py-3 text-xs">
                                {row.points}
                              </td>

                              <td className="px-3 py-3">
                                <span className="text-xs font-medium">
                                  {row.status === "ACTIVE"
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!preview.canImport && (
                  <div className="mt-5 flex gap-3 rounded-[6px] border border-[#f2caca] bg-[#fff5f5] p-4 text-sm text-[#c62828] dark:border-[#5b2b2b] dark:bg-[#321d1d] dark:text-[#ff8585]">
                    <XCircle size={18} className="mt-0.5 shrink-0" />

                    <p>
                      Fix the validation errors above and preview the file again
                      before importing.
                    </p>
                  </div>
                )}

                {preview.canImport && (
                  <div className="mt-5 flex gap-3 rounded-[6px] border border-[#cbe8d5] bg-[#f1fbf4] p-4 text-sm text-[#16834a] dark:border-[#285338] dark:bg-[#173b2a] dark:text-[#62d996]">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

                    <p>The file passed validation and is ready to import.</p>
                  </div>
                )}
              </div>
            )}

            {importError && (
              <div className="mt-4 flex gap-3 rounded-[5px] border border-[#f2caca] bg-[#fff5f5] p-3 text-sm text-[#c62828] dark:border-[#5b2b2b] dark:bg-[#321d1d] dark:text-[#ff8585]">
                <XCircle size={18} className="mt-0.5 shrink-0" />

                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="mt-4 flex gap-3 rounded-[5px] border border-[#cbe8d5] bg-[#f1fbf4] p-3 text-sm text-[#16834a] dark:border-[#285338] dark:bg-[#173b2a] dark:text-[#62d996]">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

                <span>{importSuccess}</span>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={previewing || importing}
                onClick={() => {
                  if (preview) {
                    setPreview(null);
                    setImportError("");
                    return;
                  }

                  closeImportModal();
                }}
                className="h-11 rounded-[5px] border border-[#e7e7e8] px-5 text-sm font-semibold dark:border-[#3a302a] disabled:opacity-50"
              >
                {preview ? "Back" : "Close"}
              </button>

              {!preview && (
                <button
                  type="button"
                  disabled={!importFile || previewing}
                  onClick={previewImport}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[5px] bg-[#ff6b00] px-6 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {previewing && <Loader2 size={16} className="animate-spin" />}

                  {previewing ? "Previewing..." : "Preview File"}
                </button>
              )}

              {preview && (
                <button
                  type="button"
                  disabled={!preview.canImport || importing}
                  onClick={importQuestions}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[5px] bg-[#ff6b00] px-6 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {importing && <Loader2 size={16} className="animate-spin" />}

                  {importing ? "Importing..." : "Import Questions"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
