export type SnapshotRow = {
  id: string;
  snapshot_date: string;
  snapshot_ts: string | null;
  username: string;
  area: string;
  year: number | null;
  report_query_id: string | null;
  report_page: string | null;
  report_code: string | null;
  report_desc: string | null;
  page_code: string | null;
  workbook_id: string | null;
  seller_code: string | null;
  seller_name: string | null;
  team: string | null;
  group1: string | null;
  group2: string | null;
  group3: string | null;
  month: number | null;
  closed_month_status: string | null;
  currency: number | null;
  pbi_query_calc_01: number | null;
  pbi_query_calc_02: number | null;
  pbi_query_calc_03: number | null;
  pbi_query_calc_04: number | null;
  react_calc_01: number | null;
  react_calc_02: number | null;
  react_calc_03: number | null;
  react_calc_04: number | null;
  react_calc_05: number | null;
  react_calc_06: number | null;
  react_calc_07: number | null;
  react_calc_08: number | null;
  react_calc_09: number | null;
  react_calc_10: number | null;
};

export type AvailableSnapshot = {
  snapshot_date: string;
  snapshot_ts: string | null;
  username: string;
  area: string;
  page_code: string;
  report_page: string | null;
  workbook_id: string | null;
  year: number | null;
  closed_period_label: string | null;
  closed_months_count: number | null;
  last_closed_month: string | null;
  open_months_count: number | null;
  rows_count: number;
};

export type SnapshotResponse =
  | {
      ok: true;
      rows: SnapshotRow[];
      snapshot: AvailableSnapshot | null;
      fromCache: boolean;
      isStale: boolean;
      refreshAttempted: boolean;
      warning?: string;
    }
  | { ok: false; message: string };

export type SnapshotLookup = {
  area: string;
  pageCode: string;
  year: number;
};

export type SnapshotReadResult = {
  rows: SnapshotRow[];
  snapshot: AvailableSnapshot | null;
};

export type EnsureSnapshotRequest = SnapshotLookup & {
  compareYear: number;
};

export type EnsureSnapshotResult = SnapshotReadResult & {
  fromCache: boolean;
  isStale: boolean;
  refreshAttempted: boolean;
  warning?: string;
};

export type RefreshSnapshotRequest = {
  area: string;
  pageCode: string;
  currentYear: number;
  compareYear: number;
  /** Dataset IDs from report_queries.dataset_id used for manual refresh filtering. */
  queryIds?: string[];
};

export type RefreshSnapshotResponse =
  | {
      ok: true;
      fromCache: false;
      rowCount: number;
      snapshotDate: string;
    }
  | { ok: false; message: string };

export type RefreshSnapshotResult = {
  rowCount: number;
  snapshotDate: string;
};

export type SnapshotRatioColumn =
  | "react_calc_01"
  | "react_calc_03"
  | "react_calc_06";

export type SnapshotRatioDiagnostic = {
  column: SnapshotRatioColumn;
  value: number;
  row: Record<string, unknown>;
};

export type LegacyRatioSanitizationResult = {
  rows: Record<string, unknown>[];
  changedCount: number;
};
