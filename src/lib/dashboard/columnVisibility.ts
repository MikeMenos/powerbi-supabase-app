import type { ColumnDef } from "@/lib/dashboard/types/tables";

export function isColumnVisibilityLocked(column: ColumnDef): boolean {
  return Boolean(column.primaryKey || column.protected);
}

export function filterVisibleListColumns(
  columns: ColumnDef[],
  hiddenKeys: string[],
): ColumnDef[] {
  const hiddenSet = new Set(hiddenKeys);
  return columns.filter(
    (column) =>
      isColumnVisibilityLocked(column) || !hiddenSet.has(column.key),
  );
}
