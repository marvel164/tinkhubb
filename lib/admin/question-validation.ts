export const categoryValues = [
  "GENERAL_KNOWLEDGE",
  "SCIENCE",
  "HISTORY",
  "SPORTS",
  "GEOGRAPHY",
  "ENTERTAINMENT",
  "TECHNOLOGY",
  "BUSINESS",
  "CURRENT_AFFAIRS",
] as const;

export const difficultyValues = ["EASY", "MEDIUM", "HARD"] as const;

export const statusValues = ["ACTIVE", "INACTIVE"] as const;

export type TriviaCategory = (typeof categoryValues)[number];

export type QuestionDifficulty = (typeof difficultyValues)[number];

export type QuestionStatus = (typeof statusValues)[number];

export type CorrectOption = "A" | "B" | "C" | "D";

export function normalizeQuestionText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeOptionText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function hasDuplicateOptions(options: string[]) {
  const normalized = options.map(normalizeOptionText);

  return new Set(normalized).size !== normalized.length;
}

export function normalizeCategory(value: unknown): TriviaCategory | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const aliases: Record<string, TriviaCategory> = {
    GENERAL_KNOWLEDGE: "GENERAL_KNOWLEDGE",
    GK: "GENERAL_KNOWLEDGE",

    SCIENCE: "SCIENCE",

    HISTORY: "HISTORY",

    SPORTS: "SPORTS",
    SPORT: "SPORTS",

    GEOGRAPHY: "GEOGRAPHY",

    ENTERTAINMENT: "ENTERTAINMENT",

    TECHNOLOGY: "TECHNOLOGY",
    TECH: "TECHNOLOGY",

    BUSINESS: "BUSINESS",

    CURRENT_AFFAIRS: "CURRENT_AFFAIRS",
    CURRENT: "CURRENT_AFFAIRS",
  };

  return aliases[normalized] ?? null;
}

export function normalizeDifficulty(value: unknown): QuestionDifficulty | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (normalized === "EASY") {
    return "EASY";
  }

  if (normalized === "MEDIUM" || normalized === "MED") {
    return "MEDIUM";
  }

  if (normalized === "HARD") {
    return "HARD";
  }

  return null;
}

export function normalizeStatus(value: unknown): QuestionStatus | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (normalized === "ACTIVE") {
    return "ACTIVE";
  }

  if (normalized === "INACTIVE") {
    return "INACTIVE";
  }

  return null;
}

export function normalizeCorrectOption(value: unknown): CorrectOption | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (normalized === "A" || normalized === "1" || normalized === "OPTIONA") {
    return "A";
  }

  if (normalized === "B" || normalized === "2" || normalized === "OPTIONB") {
    return "B";
  }

  if (normalized === "C" || normalized === "3" || normalized === "OPTIONC") {
    return "C";
  }

  if (normalized === "D" || normalized === "4" || normalized === "OPTIOND") {
    return "D";
  }

  return null;
}

export function calculateQuestionTimer(
  totalTimeSeconds: number,
  questionsPerSession: number,
) {
  if (!Number.isFinite(totalTimeSeconds) || totalTimeSeconds <= 0) {
    return 60;
  }

  if (!Number.isFinite(questionsPerSession) || questionsPerSession <= 0) {
    return 60;
  }

  return Math.max(1, Math.floor(totalTimeSeconds / questionsPerSession));
}
