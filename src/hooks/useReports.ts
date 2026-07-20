"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAreaCategoryTargets,
  fetchReportAreas,
  fetchReportQueries,
  fetchReportSnapshot,
  refreshReportSnapshot,
} from "@/lib/api/reports";
import { reportKeys } from "@/hooks/queryKeys";
import type { RefreshSnapshotRequest } from "@/lib/reports/types/snapshots";

export function useReportAreas() {
  return useQuery({
    queryKey: reportKeys.areas(),
    queryFn: fetchReportAreas,
    staleTime: 60_000,
  });
}

export function useReportQueries() {
  return useQuery({
    queryKey: reportKeys.queries(),
    queryFn: fetchReportQueries,
    staleTime: 60_000,
  });
}

export function useAreaCategoryTargets(area: string) {
  return useQuery({
    queryKey: reportKeys.areaCategoryTargets(area),
    queryFn: () => fetchAreaCategoryTargets(area),
    enabled: Boolean(area),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReportSnapshot(input: {
  area: string;
  pageCode: string;
  year: number;
  compareYear: number;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: reportKeys.snapshot(
      input.area,
      input.pageCode,
      input.year,
      input.compareYear,
    ),
    queryFn: () =>
      fetchReportSnapshot({
        area: input.area,
        pageCode: input.pageCode,
        year: input.year,
        compareYear: input.compareYear,
      }),
    enabled: input.enabled,
    staleTime: 30_000,
  });
}

export function useRefreshReportSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshReportSnapshot,
    onSuccess: (_data, variables: RefreshSnapshotRequest) => {
      void queryClient.invalidateQueries({
        queryKey: reportKeys.snapshot(
          variables.area,
          variables.pageCode,
          variables.currentYear,
        ),
      });
    },
  });
}
