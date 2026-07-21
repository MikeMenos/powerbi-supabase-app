import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { DashboardTableId } from "@/lib/dashboard/types/tables";

type HiddenColumnsByTable = Partial<Record<DashboardTableId, string[]>>;

type ColumnVisibilityState = {
  hiddenByTable: HiddenColumnsByTable;
  isColumnHidden: (table: DashboardTableId, columnKey: string) => boolean;
  setColumnHidden: (
    table: DashboardTableId,
    columnKey: string,
    hidden: boolean,
  ) => void;
  toggleColumn: (table: DashboardTableId, columnKey: string) => void;
  showAllColumns: (table: DashboardTableId) => void;
  pruneStaleKeys: (table: DashboardTableId, validKeys: string[]) => void;
};

const EMPTY_HIDDEN_KEYS: string[] = [];

export function selectHiddenKeysForTable(
  state: ColumnVisibilityState,
  table: DashboardTableId,
): string[] {
  return state.hiddenByTable[table] ?? EMPTY_HIDDEN_KEYS;
}

export function useHiddenColumnKeys(table: DashboardTableId) {
  return useColumnVisibilityStore((state) =>
    selectHiddenKeysForTable(state, table),
  );
}

function getHiddenSet(
  hiddenByTable: HiddenColumnsByTable,
  table: DashboardTableId,
): Set<string> {
  return new Set(hiddenByTable[table] ?? []);
}

export const useColumnVisibilityStore = create<ColumnVisibilityState>()(
  persist(
    (set, get) => ({
      hiddenByTable: {},

      isColumnHidden: (table, columnKey) =>
        getHiddenSet(get().hiddenByTable, table).has(columnKey),

      setColumnHidden: (table, columnKey, hidden) => {
        set((state) => {
          const nextHidden = new Set(getHiddenSet(state.hiddenByTable, table));
          if (hidden) {
            nextHidden.add(columnKey);
          } else {
            nextHidden.delete(columnKey);
          }

          return {
            hiddenByTable: {
              ...state.hiddenByTable,
              [table]: Array.from(nextHidden),
            },
          };
        });
      },

      toggleColumn: (table, columnKey) => {
        const hidden = get().isColumnHidden(table, columnKey);
        get().setColumnHidden(table, columnKey, !hidden);
      },

      showAllColumns: (table) => {
        set((state) => ({
          hiddenByTable: {
            ...state.hiddenByTable,
            [table]: [],
          },
        }));
      },

      pruneStaleKeys: (table, validKeys) => {
        const validSet = new Set(validKeys);
        set((state) => {
          const current = state.hiddenByTable[table] ?? [];
          const pruned = current.filter((key) => validSet.has(key));
          if (pruned.length === current.length) return state;

          return {
            hiddenByTable: {
              ...state.hiddenByTable,
              [table]: pruned,
            },
          };
        });
      },
    }),
    {
      name: "dashboard-column-visibility",
      version: 1,
    },
  ),
);
