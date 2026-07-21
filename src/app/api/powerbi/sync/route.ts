import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import { syncPowerBiCatalog } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const result = await syncPowerBiCatalog(session.token);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error, "Failed to sync Power BI catalog.", 500);
  }
}
