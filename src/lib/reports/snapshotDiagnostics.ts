import type {
  LegacyRatioSanitizationResult,
  SnapshotRatioColumn,
  SnapshotRatioDiagnostic,
} from "@/lib/reports/types/snapshots";

const RATIO_COLUMNS = [
  "react_calc_01",
  "react_calc_03",
  "react_calc_06",
] as const satisfies readonly SnapshotRatioColumn[];
const LEGACY_RATIO_LIMIT = 10_000;
const LEGACY_RATIO_SCALE = 4;

export function describeLargestSnapshotRatio(
  rows: Record<string, unknown>[],
) {
  let largest: SnapshotRatioDiagnostic | undefined;

  for (const row of rows) {
    for (const column of RATIO_COLUMNS) {
      const value = Number(row[column]);
      if (
        Number.isFinite(value) &&
        (!largest || Math.abs(value) > Math.abs(largest.value))
      ) {
        largest = { column, value, row };
      }
    }
  }

  if (!largest) return null;

  const { row } = largest;
  return [
    `${largest.column}=${largest.value}`,
    `report=${String(row.report_code ?? "unknown")}`,
    `seller=${String(row.seller_code ?? "unknown")}`,
    `group1=${String(row.group1 ?? "unknown")}`,
    `group2=${String(row.group2 ?? "unknown")}`,
    `month=${String(row.month ?? "ALL")}`,
  ].join(", ");
}

export function sanitizeLegacySnapshotRatios(
  rows: Record<string, unknown>[],
): LegacyRatioSanitizationResult {
  let changedCount = 0;
  const sanitizedRows = rows.map((row) => {
    let nextRow = row;

    for (const column of RATIO_COLUMNS) {
      const value = Number(row[column]);
      if (!Number.isFinite(value)) continue;

      const rounded = Number(value.toFixed(LEGACY_RATIO_SCALE));
      const nextValue = Math.abs(rounded) >= LEGACY_RATIO_LIMIT ? null : rounded;
      if (nextValue === row[column]) continue;

      if (nextRow === row) nextRow = { ...row };
      nextRow[column] = nextValue;
      changedCount += 1;
    }

    return nextRow;
  });

  return { rows: sanitizedRows, changedCount };
}
