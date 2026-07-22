import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import { listReportQueryTriplets } from "@/lib/dashboard/crud";

export async function GET() {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const triplets = await listReportQueryTriplets();
    return NextResponse.json({ ok: true, triplets });
  } catch (error) {
    return errorResponse(error, "Failed to list report query triplets.", 500);
  }
}
