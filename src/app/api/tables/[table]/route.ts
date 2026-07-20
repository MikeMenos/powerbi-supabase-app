import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import {
  createTableRow,
  listTableRows,
  parseListQuery,
  resolveTableId,
} from "@/lib/dashboard/crud";
import { getTableDef } from "@/lib/dashboard/tableCatalog";

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
    const query = parseListQuery(searchParams);
    const result = await listTableRows({ table, ...query });

    return NextResponse.json({
      ok: true,
      table,
      ...result,
    });
  } catch (error) {
    return errorResponse(error, "Failed to list rows.", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const { table: rawTable } = await context.params;
    const table = resolveTableId(rawTable);
    if (getTableDef(table).canCreate === false) {
      return errorResponse(
        new Error("Create is disabled for this table."),
        "Create is disabled for this table.",
        403,
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    const row = await createTableRow(table, body);
    return NextResponse.json({ ok: true, row }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create row.");
  }
}
