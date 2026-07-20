import type { JoinedSnapshotSourceRow } from "@/lib/reports/types/runtime";
import { parseMonth, readNumber, readString } from "@/lib/reports/rowUtils";

function getPowerBiRowKey(row: Record<string, unknown>) {
  return [
    readString(row, "SellerCode"),
    readString(row, "Group1"),
    readString(row, "Group2"),
    readString(row, "Month") ?? "ALL",
  ].join("|");
}

function getSnapshotUniqueKey(row: JoinedSnapshotSourceRow) {
  return [
    row.sellerCode,
    row.group1,
    row.group2,
    row.month ?? "ALL",
  ].join("|");
}

function mergeDuplicateSnapshotRows(rows: JoinedSnapshotSourceRow[]) {
  const merged = new Map<string, JoinedSnapshotSourceRow>();

  for (const row of rows) {
    const key = getSnapshotUniqueKey(row);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...row });
      continue;
    }

    current.pbi_query_calc_01 =
      (current.pbi_query_calc_01 ?? 0) + (row.pbi_query_calc_01 ?? 0);
    current.pbi_query_calc_02 =
      (current.pbi_query_calc_02 ?? 0) + (row.pbi_query_calc_02 ?? 0);
    current.pbi_query_calc_03 =
      (current.pbi_query_calc_03 ?? 0) + (row.pbi_query_calc_03 ?? 0);
    current.pbi_query_calc_04 =
      (current.pbi_query_calc_04 ?? 0) + (row.pbi_query_calc_04 ?? 0);
    if (!current.group3 && row.group3) current.group3 = row.group3;
    if (!current.sellerName && row.sellerName) {
      current.sellerName = row.sellerName;
    }
    if (!current.team && row.team) current.team = row.team;
  }

  return [...merged.values()];
}

export function joinTriptych(
  currentRows: Record<string, unknown>[],
  previousRows: Record<string, unknown>[],
  trendRows: Record<string, unknown>[],
) {
  const previous = new Map(
    previousRows.map((row) => [getPowerBiRowKey(row), row]),
  );
  const trend = new Map(trendRows.map((row) => [getPowerBiRowKey(row), row]));

  return mergeDuplicateSnapshotRows(
    currentRows.map((row) => {
      const key = getPowerBiRowKey(row);
      const previousRow = previous.get(key) ?? {};
      const trendRow = trend.get(key) ?? {};
      const monthText = readString(row, "Month");

      return {
        sellerCode: readString(row, "SellerCode"),
        sellerName: readString(row, "SellerName"),
        team: readString(row, "Team"),
        group1: readString(row, "Group1"),
        group2: readString(row, "Group2"),
        group3: readString(row, "Group3"),
        month: parseMonth(monthText),
        closedMonthStatus: readString(row, "ClosedMonthStatus"),
        pbi_query_calc_01: readNumber(row, "VCY"),
        pbi_query_calc_02: readNumber(row, "TCY"),
        pbi_query_calc_03: readNumber(previousRow, "VLY"),
        pbi_query_calc_04:
          readNumber(trendRow, "VTREND") ?? readNumber(trendRow, "VTrend"),
      } satisfies JoinedSnapshotSourceRow;
    }),
  );
}
