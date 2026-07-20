import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import {
  deleteTableRow,
  resolveTableId,
  updateTableRow,
} from "@/lib/dashboard/crud";
import { getTableDef } from "@/lib/dashboard/tableCatalog";

type RouteContext = {
  params: Promise<{ table: string; id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const { table: rawTable, id } = await context.params;
    const table = resolveTableId(rawTable);
    if (getTableDef(table).canEdit === false) {
      return errorResponse(
        new Error("Edit is disabled for this table."),
        "Edit is disabled for this table.",
        403,
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    const row = await updateTableRow(table, id, body);
    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return errorResponse(error, "Failed to update row.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const { table: rawTable, id } = await context.params;
    const table = resolveTableId(rawTable);
    if (getTableDef(table).canDelete === false) {
      return errorResponse(
        new Error("Delete is disabled for this table."),
        "Delete is disabled for this table.",
        403,
      );
    }
    await deleteTableRow(table, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Failed to delete row.");
  }
}
