import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import {
  calculateQuestionTimer,
  categoryValues,
  difficultyValues,
  hasDuplicateOptions,
  normalizeQuestionText,
} from "@/lib/admin/question-validation";

const createQuestionSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  optionA: z.string().trim().min(1).max(500),
  optionB: z.string().trim().min(1).max(500),
  optionC: z.string().trim().min(1).max(500),
  optionD: z.string().trim().min(1).max(500),
  correctOption: z.enum(["A", "B", "C", "D"]),
  category: z.enum(categoryValues),
  difficulty: z.enum(difficultyValues),
  points: z.number().int().min(0).max(100).default(1),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const questionSelect = {
  id: true,
  question: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  correctOption: true,
  category: true,
  difficulty: true,
  status: true,
  points: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");

    const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";

    const [questions, settings] = await Promise.all([
      prisma.question.findMany({
        where: {
          ...(search
            ? {
                question: {
                  contains: search,
                  mode: "insensitive",
                },
              }
            : {}),

          ...(status === "ACTIVE" || status === "INACTIVE" ? { status } : {}),

          ...(category &&
          categoryValues.includes(category as (typeof categoryValues)[number])
            ? {
                category: category as (typeof categoryValues)[number],
              }
            : {}),

          ...(difficulty &&
          difficultyValues.includes(
            difficulty as (typeof difficultyValues)[number],
          )
            ? {
                difficulty: difficulty as (typeof difficultyValues)[number],
              }
            : {}),
        },

        orderBy: {
          question: sort,
        },

        select: questionSelect,
      }),

      prisma.gameSettings.findFirst({
        orderBy: {
          updatedAt: "desc",
        },
      }),
    ]);

    const totalQuestions = questions.length;

    const activeQuestions = questions.filter(
      (question) => question.status === "ACTIVE",
    ).length;

    const inactiveQuestions = questions.filter(
      (question) => question.status === "INACTIVE",
    ).length;

    const categories = new Set(questions.map((question) => question.category));

    const totalTimeSeconds = settings?.totalTimeSeconds ?? 600;

    const questionsPerSession = settings?.questionsPerSession ?? 10;

    const timerSeconds = calculateQuestionTimer(
      totalTimeSeconds,
      questionsPerSession,
    );

    return NextResponse.json({
      success: true,

      data: questions,

      timerSeconds,

      stats: {
        total: totalQuestions,
        active: activeQuestions,
        inactive: inactiveQuestions,
        categories: categories.size,
      },

      gameSettings: {
        totalTimeSeconds,
        questionsPerSession,
        timerSeconds,
      },
    });
  } catch (error) {
    console.error("Question GET error:", error);

    return NextResponse.json(
      {
        message: "Unable to load questions.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const parsed = createQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please provide valid question details.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const options = [data.optionA, data.optionB, data.optionC, data.optionD];

    if (hasDuplicateOptions(options)) {
      return NextResponse.json(
        {
          message: "Each answer option must be different.",
          field: "options",
        },
        { status: 409 },
      );
    }

    const normalizedQuestion = normalizeQuestionText(data.question);

    const existingQuestions = await prisma.question.findMany({
      select: {
        id: true,
        question: true,
      },
    });

    const duplicate = existingQuestions.find(
      (question) =>
        normalizeQuestionText(question.question) === normalizedQuestion,
    );

    if (duplicate) {
      return NextResponse.json(
        {
          message: "A question with this text already exists.",
          field: "question",
          code: "DUPLICATE_QUESTION",
        },
        { status: 409 },
      );
    }

    const question = await prisma.question.create({
      data: {
        question: data.question,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        category: data.category,
        difficulty: data.difficulty,
        points: data.points,
        status: data.status,
      },

      select: questionSelect,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE",
        entity: "QUESTION",
        entityId: question.id,
        details: {
          question: question.question,
          category: question.category,
          difficulty: question.difficulty,
          status: question.status,
          points: question.points,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: question,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Question POST error:", error);

    return NextResponse.json(
      {
        message: "Unable to create question.",
      },
      { status: 500 },
    );
  }
}
