import "server-only";

import axios from "axios";

import { renderDaxTemplate } from "@/lib/reports/daxTemplate";
import type { ReportQuery } from "@/lib/reports/types/reportQueries";
import type { PowerBiExecuteResponse } from "@/lib/reports/types/runtime";
import type { RefreshSnapshotRequest } from "@/lib/reports/types/snapshots";

function getPowerBiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Power BI request failed.";
  }

  const data = error.response?.data as
    | {
        error?: {
          code?: string;
          message?: string;
          details?: Array<{ message?: string; value?: string }>;
        };
        message?: string;
      }
    | undefined;
  const detailMessages = data?.error?.details
    ?.map((detail) => detail.message ?? detail.value)
    .filter(Boolean);

  return (
    data?.error?.message ??
    data?.message ??
    detailMessages?.join(" | ") ??
    error.message
  );
}

export async function executeReportQuery(
  accessToken: string,
  query: ReportQuery,
  input: RefreshSnapshotRequest,
) {
  if (!query.dataset_id) {
    throw new Error(`Missing dataset_id for ${query.report_code}.`);
  }

  try {
    const response = await axios.post<PowerBiExecuteResponse>(
      `https://api.powerbi.com/v1.0/myorg/datasets/${query.dataset_id}/executeQueries`,
      {
        queries: [{ query: renderDaxTemplate(query.dax_query, input) }],
        serializerSettings: { includeNulls: true },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data.results?.[0]?.tables?.[0]?.rows ?? [];
  } catch (error) {
    throw new Error(
      `${query.report_code} failed on dataset ${query.dataset_id}: ${getPowerBiErrorMessage(error)}`,
    );
  }
}
