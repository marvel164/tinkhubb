import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import {
  normalizeCategory,
  normalizeCorrectOption,
  normalizeDifficulty,
  normalizeQuestionText,
  normalizeStatus,
  hasDuplicateOptions,
} from "@/lib/admin/question-validation";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_RETURNED_ERRORS = 100;
const MAX_PREVIEW_ROWS = 10;

type ParsedQuestion = {
  row: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  category:
    | "GENERAL_KNOWLEDGE"
    | "SCIENCE"
    | "HISTORY"
    | "SPORTS"
    | "GEOGRAPHY"
    | "ENTERTAINMENT"
    | "TECHNOLOGY"
    | "BUSINESS"
    | "CURRENT_AFFAIRS";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  status: "ACTIVE" | "INACTIVE";
};

type ImportError = {
  row: number;
  message: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeHeader(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getValue(row: Record<string, unknown>, ...names: string[]) {
  const wanted = names.map(normalizeHeader);

  for (const [key, value] of Object.entries(row)) {
    if (wanted.includes(normalizeHeader(key))) {
      return value;
    }
  }

  return "";
}

function parseBooleanStatus(value: unknown) {
  return normalizeStatus(value) ?? "ACTIVE";
}

function parseRows(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  return rows;
}

function validateRows(rows: Record<string, unknown>[]) {
  const errors: ImportError[] = [];
  const validRows: ParsedQuestion[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const sourceRow = index + 2;

    const question = clean(getValue(rows[index], "question", "questiontext"));

    const optionA = clean(getValue(rows[index], "optionA", "option a", "a"));

    const optionB = clean(getValue(rows[index], "optionB", "option b", "b"));

    const optionC = clean(getValue(rows[index], "optionC", "option c", "c"));

    const optionD = clean(getValue(rows[index], "optionD", "option d", "d"));

    const correctOption = normalizeCorrectOption(
      getValue(
        rows[index],
        "correctOption",
        "correct answer",
        "correct",
        "answer",
      ),
    );

    const category = normalizeCategory(getValue(rows[index], "category"));

    const difficulty = normalizeDifficulty(getValue(rows[index], "difficulty"));

    const status = parseBooleanStatus(getValue(rows[index], "status"));

    const rawPoints = clean(
      getValue(rows[index], "points", "points for correct answer"),
    );

    const points = rawPoints === "" ? 1 : Number(rawPoints);

    const rowErrors: string[] = [];

    if (!question) {
      rowErrors.push("Question is required.");
    } else if (question.length > 1000) {
      rowErrors.push("Question must not exceed 1000 characters.");
    }

    if (!optionA) {
      rowErrors.push("Option A is required.");
    }

    if (!optionB) {
      rowErrors.push("Option B is required.");
    }

    if (!optionC) {
      rowErrors.push("Option C is required.");
    }

    if (!optionD) {
      rowErrors.push("Option D is required.");
    }

    if (
      optionA &&
      optionB &&
      optionC &&
      optionD &&
      hasDuplicateOptions([optionA, optionB, optionC, optionD])
    ) {
      rowErrors.push("Options A-D must all be different.");
    }

    if (!correctOption) {
      rowErrors.push("Correct answer must be A, B, C, or D.");
    }

    if (!category) {
      rowErrors.push("A valid category is required.");
    }

    if (!difficulty) {
      rowErrors.push("Difficulty must be Easy, Medium, or Hard.");
    }

    if (!Number.isInteger(points) || points < 0 || points > 100) {
      rowErrors.push("Points must be a whole number between 0 and 100.");
    }

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      rowErrors.push("Status must be Active or Inactive.");
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: sourceRow,
        message: rowErrors.join(" "),
      });

      continue;
    }

    validRows.push({
      row: sourceRow,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption: correctOption!,
      category: category!,
      difficulty: difficulty!,
      points,
      status,
    });
  }

  // Detect duplicates inside the uploaded file.
  const questionGroups = new Map<string, ParsedQuestion[]>();

  for (const item of validRows) {
    const key = normalizeQuestionText(item.question);

    const existing = questionGroups.get(key) ?? [];

    existing.push(item);
    questionGroups.set(key, existing);
  }

  const duplicateRows = new Set<number>();

  for (const group of questionGroups.values()) {
    if (group.length > 1) {
      for (const item of group) {
        duplicateRows.add(item.row);

        errors.push({
          row: item.row,
          message: "Duplicate question found in this import file.",
        });
      }
    }
  }

  const filteredRows = validRows.filter((item) => !duplicateRows.has(item.row));

  return {
    validRows: filteredRows,
    errors,
    duplicateRows: duplicateRows.size,
  };
}

function getLimitedErrors(errors: ImportError[]) {
  return errors.slice(0, MAX_RETURNED_ERRORS);
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const preview = request.nextUrl.searchParams.get("preview") === "true";

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please upload a CSV, XLS, or XLSX file.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File is too large. Maximum file size is 5MB.",
        },
        { status: 400 },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension !== "csv" && extension !== "xls" && extension !== "xlsx") {
      return NextResponse.json(
        {
          error: "Unsupported file type. Upload CSV, XLS, or XLSX.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const rows = parseRows(buffer);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "The uploaded file contains no data rows.",
        },
        { status: 400 },
      );
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        {
          error: `The file contains too many rows. Maximum is ${MAX_ROWS}.`,
        },
        { status: 400 },
      );
    }

    const parsed = validateRows(rows);

    // Check against existing database questions.
    if (parsed.validRows.length > 0) {
      const existingQuestions = await prisma.question.findMany({
        select: {
          id: true,
          question: true,
        },
      });

      const existingSet = new Set(
        existingQuestions.map((item) => normalizeQuestionText(item.question)),
      );

      const databaseDuplicateRows = new Set<number>();

      for (const item of parsed.validRows) {
        if (existingSet.has(normalizeQuestionText(item.question))) {
          databaseDuplicateRows.add(item.row);

          parsed.errors.push({
            row: item.row,
            message: "This question already exists in the database.",
          });
        }
      }

      parsed.validRows = parsed.validRows.filter(
        (item) => !databaseDuplicateRows.has(item.row),
      );

      parsed.duplicateRows += databaseDuplicateRows.size;
    }

    const errors = getLimitedErrors(parsed.errors);

    if (preview) {
      return NextResponse.json({
        success: true,
        preview: true,
        filename: file.name,
        totalRows: rows.length,
        validRows: parsed.validRows.length,
        errorCount: parsed.errors.length,
        duplicateRows: parsed.duplicateRows,
        errors,
        previewRows: parsed.validRows
          .slice(0, MAX_PREVIEW_ROWS)
          .map((item) => ({
            row: item.row,
            question: item.question,
            optionA: item.optionA,
            optionB: item.optionB,
            optionC: item.optionC,
            optionD: item.optionD,
            correctOption: item.correctOption,
            category: item.category,
            difficulty: item.difficulty,
            points: item.points,
            status: item.status,
          })),
      });
    }

    // Never allow an import with validation errors.
    if (parsed.errors.length > 0) {
      return NextResponse.json(
        {
          error:
            "Import validation failed. Fix the errors and preview the file again.",
          totalRows: rows.length,
          validRows: parsed.validRows.length,
          errorCount: parsed.errors.length,
          duplicateRows: parsed.duplicateRows,
          errors,
        },
        { status: 400 },
      );
    }

    if (parsed.validRows.length === 0) {
      return NextResponse.json(
        {
          error: "There are no valid questions to import.",
        },
        { status: 400 },
      );
    }

    // Re-check duplicates immediately before insertion.
    const existingQuestions = await prisma.question.findMany({
      select: {
        question: true,
      },
    });

    const existingSet = new Set(
      existingQuestions.map((item) => normalizeQuestionText(item.question)),
    );

    const raceDuplicates = parsed.validRows.filter((item) =>
      existingSet.has(normalizeQuestionText(item.question)),
    );

    if (raceDuplicates.length > 0) {
      return NextResponse.json(
        {
          error: "Some questions already exist. Please preview the file again.",
          errors: raceDuplicates.map((item) => ({
            row: item.row,
            message: "This question already exists in the database.",
          })),
        },
        { status: 409 },
      );
    }

    const imported = await prisma.$transaction(async (tx) => {
      const result = await tx.question.createMany({
        data: parsed.validRows.map((item) => ({
          question: item.question,
          optionA: item.optionA,
          optionB: item.optionB,
          optionC: item.optionC,
          optionD: item.optionD,
          correctOption: item.correctOption,
          category: item.category,
          difficulty: item.difficulty,
          points: item.points,
          status: item.status,
        })),
      });

  

      return result.count;
    });

    return NextResponse.json({
      success: true,
      preview: false,
      filename: file.name,
      imported,
    });
  } catch (error) {
    console.error("Question import failed:", error);

    return NextResponse.json(
      {
        error:
          "Unable to process the uploaded file. Please check the file format and try again.",
      },
      { status: 500 },
    );
  }
}
