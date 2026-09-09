import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const categoryValues = [
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

const difficultyValues = ["EASY", "MEDIUM", "HARD"] as const;

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

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status");
  const sort = searchParams.get("sort") === "desc" ? "desc" : "asc";

  const questions = await prisma.question.findMany({
    where: {
      ...(search
        ? {
            question: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
      ...(status === "ACTIVE" || status === "INACTIVE"
        ? {
            status,
          }
        : {}),
    },
    orderBy: {
      question: sort,
    },
    select: {
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
    },
  });

  return NextResponse.json({
    success: true,
    data: questions,
  });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
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

    const question = await prisma.question.create({
      data: parsed.data,
      select: {
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
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "CREATE",
        entity: "QUESTION",
        entityId: question.id,
        details: {
          question: question.question,
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
  } catch {
    return NextResponse.json(
      {
        message: "Unable to create question.",
      },
      { status: 500 },
    );
  }
}
