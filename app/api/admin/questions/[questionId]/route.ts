import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";
import {
  categoryValues,
  difficultyValues,
  hasDuplicateOptions,
  normalizeQuestionText,
} from "@/lib/admin/question-validation";

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

type RouteContext = {
  params: Promise<{
    questionId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { questionId } = await params;

  try {
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
      },

      select: questionSelect,
    });

    if (!question) {
      return NextResponse.json(
        {
          message: "Question not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Question GET by ID error:", error);

    return NextResponse.json(
      {
        message: "Unable to load question.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
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
      where: {
        id: questionId,
      },

      select: {
        id: true,
        question: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          message: "Question not found.",
        },
        { status: 404 },
      );
    }

    const options = [
      parsed.data.optionA,
      parsed.data.optionB,
      parsed.data.optionC,
      parsed.data.optionD,
    ];

    if (hasDuplicateOptions(options)) {
      return NextResponse.json(
        {
          message: "Each answer option must be different.",
          field: "options",
          code: "DUPLICATE_OPTIONS",
        },
        { status: 409 },
      );
    }

    const normalizedQuestion = normalizeQuestionText(parsed.data.question);

    const possibleDuplicates = await prisma.question.findMany({
      where: {
        id: {
          not: questionId,
        },
      },

      select: {
        id: true,
        question: true,
      },
    });

    const duplicate = possibleDuplicates.find(
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

    const question = await prisma.question.update({
      where: {
        id: questionId,
      },

      data: {
        question: parsed.data.question,
        optionA: parsed.data.optionA,
        optionB: parsed.data.optionB,
        optionC: parsed.data.optionC,
        optionD: parsed.data.optionD,
        correctOption: parsed.data.correctOption,
        category: parsed.data.category,
        difficulty: parsed.data.difficulty,
        points: parsed.data.points,
        status: parsed.data.status,
      },

      select: questionSelect,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE",
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

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Question PATCH error:", error);

    return NextResponse.json(
      {
        message: "Unable to update question.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { questionId } = await params;

  try {
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
      },

      select: {
        id: true,
        question: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          message: "Question not found.",
        },
        { status: 404 },
      );
    }

    const usageCount = await prisma.gameQuestion.count({
      where: {
        questionId,
      },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          message:
            "This question has already been used in a game and cannot be permanently deleted. Deactivate it instead.",
          code: "QUESTION_IN_USE",
          usageCount,
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.question.delete({
        where: {
          id: questionId,
        },
      });

      await tx.adminAuditLog.create({
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
    });

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error("Question DELETE error:", error);

    return NextResponse.json(
      {
        message: "Unable to delete question.",
      },
      { status: 500 },
    );
  }
}
