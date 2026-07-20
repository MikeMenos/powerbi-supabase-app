import { NextResponse } from "next/server";

import { listReportQueries } from "@/lib/reports/snapshotRuntime";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listReportQueries();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load report queries.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
