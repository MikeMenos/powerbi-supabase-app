import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import { resolveTableId } from "@/lib/dashboard/crud";
import { dropLiveColumn, listLiveColumns } from "@/lib/dashboard/schema";

type RouteContext = {
  params: Promise<{ table: string; column: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const { table: rawTable, column } = await context.params;
    const table = resolveTableId(rawTable);
    await dropLiveColumn({ table, column: decodeURIComponent(column) });
    const columns = await listLiveColumns(table);
    return NextResponse.json({ ok: true, columns });
  } catch (error) {
    return errorResponse(error, "Failed to delete column.");
  }
}
