import type { ColumnDef } from "@/lib/dashboard/types/tables";

/** Primary-key / bare `id` columns — hidden by default, but toggleable. */
export function isIdColumn(column: ColumnDef): boolean {
  return Boolean(column.primaryKey) || column.key === "id";
}

/**
 * Columns that cannot be hidden in the list UI.
 * Identity PKs are intentionally not locked so they can start hidden.
 */
export function isColumnVisibilityLocked(column: ColumnDef): boolean {
  if (isIdColumn(column)) return false;
  return Boolean(column.protected);
}

export function getDefaultHiddenColumnKeys(columns: ColumnDef[]): string[] {
  return columns.filter(isIdColumn).map((column) => column.key);
}

/**
 * Resolve which columns are hidden.
 * - `undefined` store entry → defaults (hide ID columns)
 * - `[]` → user explicitly showed all
 * - otherwise → stored preference
 */
export function resolveHiddenColumnKeys(
  columns: ColumnDef[],
  storedHidden: string[] | undefined,
): string[] {
  if (storedHidden === undefined) {
    return getDefaultHiddenColumnKeys(columns);
  }
  return storedHidden;
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
