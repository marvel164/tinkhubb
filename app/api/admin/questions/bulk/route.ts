import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

const bulkSchema = z.object({
  action: z.enum(["DELETE", "ACTIVATE", "DEACTIVATE"]),
  questionIds: z.array(z.string().min(1)).min(1).max(500),
});

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
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please select at least one valid question.",
        },
        { status: 400 },
      );
    }

    const { action, questionIds } = parsed.data;

    const existingQuestions = await prisma.question.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      select: {
        id: true,
        question: true,
        status: true,
      },
    });

    if (existingQuestions.length === 0) {
      return NextResponse.json(
        { message: "No matching questions were found." },
        { status: 404 },
      );
    }

    if (action === "DELETE") {
      await prisma.$transaction(async (tx) => {
        await tx.question.deleteMany({
          where: {
            id: {
              in: existingQuestions.map((item) => item.id),
            },
          },
        });

        await tx.adminAuditLog.create({
          data: {
            adminId: admin.id,
            action: "DELETE",
            entity: "QUESTION",
            details: {
              bulk: true,
              count: existingQuestions.length,
              questionIds: existingQuestions.map((item) => item.id),
            },
          },
        });
      });
    } else {
      const status = action === "ACTIVATE" ? "ACTIVE" : "INACTIVE";

      await prisma.$transaction(async (tx) => {
        await tx.question.updateMany({
          where: {
            id: {
              in: existingQuestions.map((item) => item.id),
            },
          },
          data: {
            status,
          },
        });

        await tx.adminAuditLog.create({
          data: {
            adminId: admin.id,
            action: "UPDATE",
            entity: "QUESTION",
            details: {
              bulk: true,
              action,
              count: existingQuestions.length,
              questionIds: existingQuestions.map((item) => item.id),
              status,
            },
          },
        });
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === "DELETE"
          ? `${existingQuestions.length} question${
              existingQuestions.length === 1 ? "" : "s"
            } deleted successfully.`
          : `${existingQuestions.length} question${
              existingQuestions.length === 1 ? "" : "s"
            } ${
              action === "ACTIVATE" ? "activated" : "deactivated"
            } successfully.`,
      count: existingQuestions.length,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to complete the bulk action.",
      },
      { status: 500 },
    );
  }
}