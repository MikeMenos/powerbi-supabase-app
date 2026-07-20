import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import { listFkOptions, resolveTableId } from "@/lib/dashboard/crud";

type RouteContext = {
  params: Promise<{ table: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const { table: rawTable } = await context.params;
    const table = resolveTableId(rawTable);
    const { searchParams } = new URL(request.url);
    const options = await listFkOptions(table, {
      valueKey: searchParams.get("valueKey") ?? undefined,
      labelKey: searchParams.get("labelKey") ?? undefined,
    });
    return NextResponse.json({ ok: true, options });
  } catch (error) {
    return errorResponse(error, "Failed to load foreign key options.", 500);
  }
}
