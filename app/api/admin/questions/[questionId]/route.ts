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

const updateQuestionSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  optionA: z.string().trim().min(1).max(500),
  optionB: z.string().trim().min(1).max(500),
  optionC: z.string().trim().min(1).max(500),
  optionD: z.string().trim().min(1).max(500),
  correctOption: z.enum(["A", "B", "C", "D"]),
  category: z.enum(categoryValues),
  difficulty: z.enum(difficultyValues),
  points: z.number().int().min(0).max(100),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type RouteContext = {
  params: Promise<{
    questionId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  const { questionId } = await params;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
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

  if (!question) {
    return NextResponse.json(
      { message: "Question not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: question,
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  const { questionId } = await params;

  try {
    const body = await request.json();
    const parsed = updateQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please provide valid question details.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { message: "Question not found." },
        { status: 404 },
      );
    }

    const question = await prisma.question.update({
      where: { id: questionId },
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
        action: "UPDATE",
        entity: "QUESTION",
        entityId: question.id,
        details: {
          question: question.question,
          status: question.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to update question." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  const { questionId } = await params;

  try {
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        question: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { message: "Question not found." },
        { status: 404 },
      );
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "DELETE",
        entity: "QUESTION",
        entityId: existingQuestion.id,
        details: {
          question: existingQuestion.question,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to delete question." },
      { status: 500 },
    );
  }
}
