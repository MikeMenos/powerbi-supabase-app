import type { JoinedSnapshotSourceRow } from "@/lib/reports/types/runtime";

const MONTH_LOOKUP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function readString(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const value = row[`[${key}]`] ?? row[key];
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function readNumber(
  row: Record<string, unknown>,
  key: string,
): number | null {
  const value = row[`[${key}]`] ?? row[key];
  if (value == null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function parseMonth(value: string | null): number | null {
  if (!value) return null;
  const numeric = value.trim().match(/^0?([1-9]|1[0-2])\b/);
  if (numeric) return Number(numeric[1]);

  const text = value
    .trim()
    .replace(/^\d+\s*/, "")
    .replace(".", "")
    .slice(0, 9)
    .toLowerCase();

  return MONTH_LOOKUP[text] ?? MONTH_LOOKUP[text.slice(0, 3)] ?? null;
}

function safeRatio(left: number | null, right: number | null) {
  return right && left != null ? left / right : null;
}

export function computeSnapshotFields(
  calc01: number | null,
  calc02: number | null,
  calc03: number | null,
  calc04: number | null,
  openMonths: number,
) {
  const react_calc_08 = calc02 != null ? calc02 / 12 : null;
  const react_calc_09 =
    calc04 != null && calc01 != null && openMonths
      ? (calc04 - calc01) / openMonths
      : null;

  return {
    react_calc_01: safeRatio(calc01, calc02),
    react_calc_02: calc01 != null && calc02 != null ? calc01 - calc02 : null,
    react_calc_03: safeRatio(calc01, calc03),
    react_calc_04: calc01 != null && calc03 != null ? calc01 - calc03 : null,
    react_calc_05: calc04,
    react_calc_06: safeRatio(calc01, calc04),
    react_calc_07: calc01 != null && calc04 != null ? calc01 - calc04 : null,
    react_calc_08,
    react_calc_09,
    react_calc_10:
      react_calc_08 != null && react_calc_09 != null
        ? react_calc_08 + react_calc_09
        : null,
  };
}

export function getPeriodMeta(rows: JoinedSnapshotSourceRow[]) {
  const closedMonths = new Set<number>();

  for (const row of rows) {
    if (
      row.closedMonthStatus?.trim().toLowerCase() === "completed" &&
      row.month
    ) {
      closedMonths.add(row.month);
    }
  }

  const closed = [...closedMonths].sort((left, right) => left - right);
  const lastClosedMonth = closed.at(-1) ?? null;
  const closedMonthsCount = closed.length;
  const openMonths = Math.max(12 - closedMonthsCount, 0);

  return {
    closedPeriodLabel:
      closedMonthsCount > 0 ? `1-${lastClosedMonth}` : "No closed months",
    closedMonthsCount,
    lastClosedMonth: lastClosedMonth == null ? null : String(lastClosedMonth),
    openMonths,
  };
}
