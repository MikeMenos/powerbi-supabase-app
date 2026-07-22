"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { initializationKeys, tableKeys } from "@/hooks/queryKeys";
import { syncPowerBiCatalogRequest } from "@/lib/api/powerbi";
import {
  addTableColumnRequest,
  createTableRowRequest,
  deleteTableColumnRequest,
  deleteTableRowRequest,
  fetchFkOptions,
  fetchReportQueryTriplets,
  fetchTableColumns,
  fetchTableRows,
  fetchTableSummaries,
  updateTableRowRequest,
} from "@/lib/api/tables";
import type {
  AddColumnRequest,
  DashboardTableId,
} from "@/lib/dashboard/types/tables";

const POWER_BI_SYNC_TABLES = new Set<DashboardTableId>([
  "powerbi_groups",
  "powerbi_datasets",
]);

export function isPowerBiSyncTable(table: DashboardTableId) {
  return POWER_BI_SYNC_TABLES.has(table);
}

export function useTableSummaries(enabled = true) {
  return useQuery({
    queryKey: tableKeys.summary(),
    queryFn: fetchTableSummaries,
    enabled,
    staleTime: 15_000,
  });
}

export function useTableColumns(table: DashboardTableId, enabled = true) {
  return useQuery({
    queryKey: tableKeys.columns(table),
    queryFn: () => fetchTableColumns(table),
    enabled,
    staleTime: 10_000,
  });
}

export function useTableRows(
  table: DashboardTableId,
  input: {
    page: number;
    pageSize: number;
    search: string;
    filters?: Record<string, string>;
    reportCodeBase?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: tableKeys.list(
      table,
      input.page,
      input.pageSize,
      input.search,
      input.filters,
      input.reportCodeBase,
    ),
    queryFn: () =>
      fetchTableRows({
        table,
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
        filters: input.filters,
        reportCodeBase: input.reportCodeBase,
      }),
    enabled,
    staleTime: 10_000,
  });
}

export function useReportQueryTriplets(enabled = true) {
  return useQuery({
    queryKey: tableKeys.reportQueryTriplets(),
    queryFn: fetchReportQueryTriplets,
    enabled,
    staleTime: 15_000,
  });
}

export function useFkOptions(
  table: DashboardTableId | undefined,
  options?: {
    valueKey?: string;
    labelKey?: string;
    descriptionKey?: string;
    enabled?: boolean;
  },
) {
  const valueKey = options?.valueKey ?? "id";
  const labelKey = options?.labelKey ?? "id";
  const descriptionKey = options?.descriptionKey ?? "";
  return useQuery({
    queryKey: tableKeys.fkOptions(
      table ?? "none",
      valueKey,
      labelKey,
      descriptionKey,
    ),
    queryFn: () =>
      fetchFkOptions(table!, {
        valueKey: options?.valueKey,
        labelKey: options?.labelKey,
        descriptionKey: options?.descriptionKey,
      }),
    enabled: Boolean(table) && (options?.enabled ?? true),
    staleTime: 60_000,
  });
}

export function useCreateTableRow(table: DashboardTableId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      createTableRowRequest(table, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useUpdateTableRow(table: DashboardTableId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; body: Record<string, unknown> }) =>
      updateTableRowRequest(table, input.id, input.body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useDeleteTableRow(table: DashboardTableId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTableRowRequest(table, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useAddTableColumn(table: DashboardTableId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddColumnRequest) => addTableColumnRequest(table, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useDeleteTableColumn(table: DashboardTableId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (column: string) => deleteTableColumnRequest(table, column),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useRefreshTable(table: DashboardTableId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (isPowerBiSyncTable(table)) {
        return syncPowerBiCatalogRequest();
      }
      return null;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tableKeys.all }),
        queryClient.invalidateQueries({ queryKey: initializationKeys.all }),
      ]);
    },
  });
}
