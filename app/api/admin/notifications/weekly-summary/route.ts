import { NextResponse } from "next/server";

import { generateWeeklyPerformanceSummary } from "@/lib/notifications/weekly-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured.");

    return NextResponse.json(
      { error: "Cron secret is not configured" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateWeeklyPerformanceSummary();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/admin/notifications/weekly-summary error:", error);

    return NextResponse.json(
      { error: "Failed to generate weekly performance summary" },
      { status: 500 },
    );
  }
}
