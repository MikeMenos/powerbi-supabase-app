import { apiClient, unwrapApiResponse } from "@/lib/api/client";
import type {
  AddColumnRequest,
  ColumnDef,
  ColumnType,
  DashboardTableId,
  FkOption,
  TableListResponse,
  TableMutationResponse,
  TableRow,
  TableSummaryItem,
} from "@/lib/dashboard/types/tables";

export async function fetchTableSummaries() {
  const response = await apiClient.get<{
    ok: true;
    tables: TableSummaryItem[];
  }>("/api/tables/summary", {
    headers: { "Cache-Control": "no-store" },
  });
  return unwrapApiResponse(response, "Failed to load table summaries.").tables;
}

export async function fetchTableRows(input: {
  table: DashboardTableId;
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const response = await apiClient.get<TableListResponse>(
    `/api/tables/${input.table}`,
    {
      params: {
        page: input.page,
        pageSize: input.pageSize,
        search: input.search || undefined,
      },
      headers: { "Cache-Control": "no-store" },
    },
  );
  return unwrapApiResponse(response, "Failed to load rows.");
}

export async function fetchTableColumns(table: DashboardTableId) {
  const response = await apiClient.get<{
    ok: true;
    columns: ColumnDef[];
    addableTypes: Array<{ value: Exclude<ColumnType, "fk">; label: string }>;
    schemaRpcReady?: boolean;
    schemaRpcHint?: string | null;
  }>(`/api/tables/${table}/columns`, {
    headers: { "Cache-Control": "no-store" },
  });
  return unwrapApiResponse(response, "Failed to load columns.");
}

export async function addTableColumnRequest(
  table: DashboardTableId,
  body: AddColumnRequest,
) {
  const response = await apiClient.post<{ ok: true; columns: ColumnDef[] }>(
    `/api/tables/${table}/columns`,
    body,
  );
  return unwrapApiResponse(response, "Failed to add column.").columns;
}

export async function deleteTableColumnRequest(
  table: DashboardTableId,
  column: string,
) {
  const response = await apiClient.delete<{ ok: true; columns: ColumnDef[] }>(
    `/api/tables/${table}/columns/${encodeURIComponent(column)}`,
  );
  return unwrapApiResponse(response, "Failed to delete column.").columns;
}

export async function createTableRowRequest(
  table: DashboardTableId,
  body: Record<string, unknown>,
) {
  const response = await apiClient.post<TableMutationResponse>(
    `/api/tables/${table}`,
    body,
  );
  return unwrapApiResponse(response, "Failed to create row.").row;
}

export async function updateTableRowRequest(
  table: DashboardTableId,
  id: string,
  body: Record<string, unknown>,
) {
  const response = await apiClient.patch<TableMutationResponse>(
    `/api/tables/${table}/${id}`,
    body,
  );
  return unwrapApiResponse(response, "Failed to update row.").row;
}

export async function deleteTableRowRequest(
  table: DashboardTableId,
  id: string,
) {
  const response = await apiClient.delete<{ ok: true }>(
    `/api/tables/${table}/${id}`,
  );
  return unwrapApiResponse(response, "Failed to delete row.");
}

export async function fetchFkOptions(
  table: DashboardTableId,
  options?: { valueKey?: string; labelKey?: string },
) {
  const response = await apiClient.get<{ ok: true; options: FkOption[] }>(
    `/api/tables/${table}/options`,
    {
      params: {
        valueKey: options?.valueKey,
        labelKey: options?.labelKey,
      },
      headers: { "Cache-Control": "no-store" },
    },
  );
  return unwrapApiResponse(response, "Failed to load options.").options;
}

export type { TableRow };
