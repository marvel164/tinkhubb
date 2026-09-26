import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const bulkSchema = z.object({
  action: z.enum(["DELETE", "ACTIVATE", "DEACTIVATE"]),

  questionIds: z.array(z.string().uuid()).min(1).max(500),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid bulk action.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { action, questionIds } = parsed.data;

    const uniqueQuestionIds = [...new Set(questionIds)];

    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: uniqueQuestionIds,
        },
      },

      select: {
        id: true,
        question: true,
      },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        {
          message: "No matching questions were found.",
        },
        { status: 404 },
      );
    }

    /*
     * If some IDs no longer exist, do not silently
     * pretend they were processed.
     */
    const foundIds = new Set(questions.map((question) => question.id));

    const missingCount = uniqueQuestionIds.filter(
      (id) => !foundIds.has(id),
    ).length;

    if (action === "DELETE") {
      /*
       * Check all selected questions before
       * performing ANY deletion.
       *
       * This keeps the bulk delete atomic from
       * the user's perspective: if one selected
       * question is part of game history, none
       * of the selected questions are deleted.
       */
      const usedQuestions = await prisma.gameQuestion.findMany({
        where: {
          questionId: {
            in: questions.map((question) => question.id),
          },
        },

        select: {
          questionId: true,
        },

        distinct: ["questionId"],
      });

      if (usedQuestions.length > 0) {
        const usedIds = new Set(usedQuestions.map((item) => item.questionId));

        const blockedQuestions = questions
          .filter((question) => usedIds.has(question.id))
          .map((question) => question.question);

        return NextResponse.json(
          {
            message:
              "Some selected questions have already been used in games and cannot be permanently deleted. Deactivate them instead.",

            code: "QUESTIONS_IN_USE",

            blockedCount: blockedQuestions.length,

            blockedQuestions,

            missingCount,
          },
          { status: 409 },
        );
      }
    }

    let affected = 0;

    await prisma.$transaction(async (tx) => {
      if (action === "DELETE") {
        const result = await tx.question.deleteMany({
          where: {
            id: {
              in: questions.map((question) => question.id),
            },
          },
        });

        affected = result.count;
      }

      if (action === "ACTIVATE") {
        const result = await tx.question.updateMany({
          where: {
            id: {
              in: questions.map((question) => question.id),
            },
          },

          data: {
            status: "ACTIVE",
          },
        });

        affected = result.count;
      }

      if (action === "DEACTIVATE") {
        const result = await tx.question.updateMany({
          where: {
            id: {
              in: questions.map((question) => question.id),
            },
          },

          data: {
            status: "INACTIVE",
          },
        });

        affected = result.count;
      }

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: action === "DELETE" ? "DELETE" : "UPDATE",
          entity: "QUESTION",

          details: {
            bulkAction: action,
            questionIds: questions.map((question) => question.id),
            affected,
            missingCount,
          },
        },
      });
    });

    const actionLabel =
      action === "DELETE"
        ? "deleted"
        : action === "ACTIVATE"
          ? "activated"
          : "deactivated";

    return NextResponse.json({
      success: true,

      message: `${affected} question${
        affected === 1 ? "" : "s"
      } ${actionLabel} successfully.`,

      affected,

      missingCount,
    });
  } catch (error) {
    console.error("Question bulk action error:", error);

    return NextResponse.json(
      {
        message: "Unable to complete the bulk action.",
      },
      { status: 500 },
    );
  }
}
