import "server-only";

import axios from "axios";

import type { PowerBiSellerRow } from "@/lib/reports/types/areas";
import type { PowerBiExecuteResponse } from "@/lib/reports/types/runtime";

const SELLERS_DATASET_ID = "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f";
const SELLERS_CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

let sellersCatalogCache: {
  fetchedAt: number;
  records: PowerBiSellerRow[];
} | null = null;

function readString(row: Record<string, unknown>, key: string) {
  const value = row[`[${key}]`] ?? row[key];
  return value == null ? "" : String(value).trim();
}

function buildPowerBiSellersQuery() {
  return [
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  'ASP_EBS_SELLERS',",
    '  "SellerCode", \'ASP_EBS_SELLERS\'[SellerCode],',
    '  "SalesPerson", \'ASP_EBS_SELLERS\'[Sales Person],',
    '  "Team", \'ASP_EBS_SELLERS\'[Team],',
    '  "Area", \'ASP_EBS_SELLERS\'[Area]',
    ")",
    "ORDER BY [Area], [Team], [SalesPerson]",
  ].join("\n");
}

function normalizePowerBiSellerRows(
  response: PowerBiExecuteResponse,
): PowerBiSellerRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    sellerCode: readString(row, "SellerCode"),
    salesPerson: readString(row, "SalesPerson"),
    team: readString(row, "Team"),
    area: readString(row, "Area"),
  }));
}

export function getUniquePowerBiAreas(records: PowerBiSellerRow[]) {
  const areas = new Set<string>();

  for (const record of records) {
    const area = record.area.trim();
    if (area) areas.add(area);
  }

  return [...areas].sort((left, right) =>
    left.localeCompare(right, "el", { sensitivity: "base" }),
  );
}

export async function fetchPowerBiSellersCatalog(
  accessToken: string,
  options: { forceRefresh?: boolean } = {},
) {
  if (
    !options.forceRefresh &&
    sellersCatalogCache &&
    Date.now() - sellersCatalogCache.fetchedAt < SELLERS_CATALOG_CACHE_TTL_MS
  ) {
    return sellersCatalogCache.records;
  }

  const response = await axios.post<PowerBiExecuteResponse>(
    `https://api.powerbi.com/v1.0/myorg/datasets/${SELLERS_DATASET_ID}/executeQueries`,
    {
      queries: [{ query: buildPowerBiSellersQuery() }],
      serializerSettings: { includeNulls: true },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const records = normalizePowerBiSellerRows(response.data);

  sellersCatalogCache = {
    fetchedAt: Date.now(),
    records,
  };

  return records;
}
