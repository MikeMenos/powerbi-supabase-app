import { apiClient, unwrapApiResponse } from "@/lib/api/client";
import type { PowerBiSyncResult } from "@/lib/types/initialization";

export async function syncPowerBiCatalogRequest() {
  const response = await apiClient.post<{ ok: true } & PowerBiSyncResult>(
    "/api/powerbi/sync",
  );
  return unwrapApiResponse(response, "Failed to sync Power BI catalog.");
}
