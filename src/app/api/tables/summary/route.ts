import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import { getTableSummaries } from "@/lib/dashboard/crud";

export async function GET() {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const tables = await getTableSummaries();
    return NextResponse.json({ ok: true, tables });
  } catch (error) {
    return errorResponse(error, "Failed to load table summaries.", 500);
  }
}
