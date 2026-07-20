import { NextResponse } from "next/server";

import {
  errorResponse,
  requireDashboardSession,
  unauthorizedResponse,
} from "@/lib/dashboard/apiAuth";
import { resolveTableId } from "@/lib/dashboard/crud";
import {
  ADDABLE_COLUMN_TYPES,
  addLiveColumn,
  listLiveColumns,
  probeSchemaRpc,
  SCHEMA_RPC_HINT,
} from "@/lib/dashboard/schema";
import type { AddColumnRequest, ColumnType } from "@/lib/dashboard/types/tables";

type RouteContext = {
  params: Promise<{ table: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const { table: rawTable } = await context.params;
    const table = resolveTableId(rawTable);
    const [columns, schemaRpcReady] = await Promise.all([
      listLiveColumns(table),
      probeSchemaRpc(),
    ]);
    return NextResponse.json({
      ok: true,
      table,
      columns,
      addableTypes: ADDABLE_COLUMN_TYPES,
      schemaRpcReady,
      schemaRpcHint: schemaRpcReady ? null : SCHEMA_RPC_HINT,
    });
  } catch (error) {
    return errorResponse(error, "Failed to load columns.", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireDashboardSession();
  if (!session) return unauthorizedResponse();

  try {
    const { table: rawTable } = await context.params;
    const table = resolveTableId(rawTable);
    const body = (await request.json()) as AddColumnRequest;
    const type = body.type as Exclude<ColumnType, "fk">;
    if (!body.column?.trim() || !type) {
      return errorResponse(
        new Error("column and type are required."),
        "column and type are required.",
      );
    }

    await addLiveColumn({
      table,
      column: body.column,
      type,
      nullable: body.nullable,
    });
    const columns = await listLiveColumns(table);
    return NextResponse.json({ ok: true, columns }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to add column.");
  }
}
