"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tableKeys } from "@/hooks/queryKeys";
import {
  addTableColumnRequest,
  createTableRowRequest,
  deleteTableColumnRequest,
  deleteTableRowRequest,
  fetchFkOptions,
  fetchTableColumns,
  fetchTableRows,
  fetchTableSummaries,
  updateTableRowRequest,
} from "@/lib/api/tables";
import type {
  AddColumnRequest,
  DashboardTableId,
} from "@/lib/dashboard/types/tables";

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
  input: { page: number; pageSize: number; search: string },
  enabled = true,
) {
  return useQuery({
    queryKey: tableKeys.list(
      table,
      input.page,
      input.pageSize,
      input.search,
    ),
    queryFn: () =>
      fetchTableRows({
        table,
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
      }),
    enabled,
    staleTime: 10_000,
  });
}

export function useFkOptions(
  table: DashboardTableId | undefined,
  options?: { valueKey?: string; labelKey?: string; enabled?: boolean },
) {
  const valueKey = options?.valueKey ?? "id";
  const labelKey = options?.labelKey ?? "id";
  return useQuery({
    queryKey: tableKeys.fkOptions(table ?? "none", valueKey, labelKey),
    queryFn: () =>
      fetchFkOptions(table!, {
        valueKey: options?.valueKey,
        labelKey: options?.labelKey,
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
