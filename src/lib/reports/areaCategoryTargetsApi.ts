import "server-only";

import axios from "axios";

import {
  buildAreaCategoryTargetsQuery,
  findAreaCategoryTargetsRow,
  normalizeAreaCategoryTargetsRows,
} from "@/lib/reports/areaCategoryTargets";
import type {
  AreaCategoryTargetsCache,
  AreaCategoryTargetsRow,
} from "@/lib/reports/types/areaCategoryTargets";
import type { PowerBiExecuteResponse } from "@/lib/reports/types/runtime";

const AREA_TARGETS_DATASET_ID = "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f";
const AREA_TARGETS_CACHE_TTL_MS = 5 * 60 * 1000;

let areaTargetsCache: AreaCategoryTargetsCache | null = null;

async function fetchAreaCategoryTargetRows(
  accessToken: string,
): Promise<AreaCategoryTargetsRow[]> {
  if (
    areaTargetsCache &&
    Date.now() - areaTargetsCache.fetchedAt < AREA_TARGETS_CACHE_TTL_MS
  ) {
    return areaTargetsCache.records;
  }

  const response = await axios.post<PowerBiExecuteResponse>(
    `https://api.powerbi.com/v1.0/myorg/datasets/${AREA_TARGETS_DATASET_ID}/executeQueries`,
    {
      queries: [{ query: buildAreaCategoryTargetsQuery() }],
      serializerSettings: { includeNulls: true },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const records = normalizeAreaCategoryTargetsRows(response.data);
  areaTargetsCache = { fetchedAt: Date.now(), records };
  return records;
}

export async function fetchAreaCategoryTargets(
  accessToken: string,
  area: string,
) {
  const records = await fetchAreaCategoryTargetRows(accessToken);
  return findAreaCategoryTargetsRow(records, area);
}
