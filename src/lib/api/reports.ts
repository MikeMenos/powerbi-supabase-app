import { apiClient, unwrapApiResponse } from "@/lib/api/client";
import type {
  RefreshSnapshotRequest,
  RefreshSnapshotResponse,
  SnapshotResponse,
} from "@/lib/reports/types/snapshots";
import type { ReportAreasResponse } from "@/lib/reports/types/areas";
import type { AreaCategoryTargetsResponse } from "@/lib/reports/types/areaCategoryTargets";
import type { ReportQueriesResponse } from "@/lib/reports/types/reportQueries";

export async function fetchReportAreas() {
  const response = await apiClient.get<ReportAreasResponse>("/api/report-areas");
  return unwrapApiResponse(response, "Failed to load areas.");
}

export async function fetchReportQueries() {
  const response = await apiClient.get<ReportQueriesResponse>(
    "/api/report-queries",
  );
  return unwrapApiResponse(response, "Failed to load report queries.");
}

export async function fetchAreaCategoryTargets(area: string) {
  const response = await apiClient.get<AreaCategoryTargetsResponse>(
    "/api/powerbi/area-category-targets",
    { params: { area } },
  );
  return unwrapApiResponse(
    response,
    "Failed to load report availability for this area.",
  );
}

export async function fetchReportSnapshot(input: {
  area: string;
  pageCode: string;
  year: number;
  compareYear: number;
}) {
  const response = await apiClient.get<SnapshotResponse>(
    "/api/report-snapshots",
    {
      params: input,
    },
  );
  return unwrapApiResponse(response, "Failed to load report snapshot.");
}

export async function refreshReportSnapshot(input: RefreshSnapshotRequest) {
  const response = await apiClient.post<RefreshSnapshotResponse>(
    "/api/report-snapshots/refresh",
    input,
  );
  return unwrapApiResponse(response, "Failed to refresh report snapshot.");
}
