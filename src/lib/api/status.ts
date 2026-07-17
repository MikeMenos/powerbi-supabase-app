import { apiClient, unwrapApiResponse } from "@/lib/api/client";
import type {
  InitializationStatus,
  InitializationStatusResponse,
} from "@/types/initialization";

export async function fetchInitializationStatus(): Promise<InitializationStatus> {
  const response = await apiClient.get<InitializationStatusResponse>(
    "/api/status",
    {
      headers: { "Cache-Control": "no-store" },
    },
  );

  const data = unwrapApiResponse(
    response,
    "Failed to read sync status.",
  ) as InitializationStatusResponse;

  if (!data.ok) {
    throw new Error(data.message);
  }

  return {
    initialized: data.initialized,
    groupCount: data.groupCount,
    datasetCount: data.datasetCount,
  };
}
