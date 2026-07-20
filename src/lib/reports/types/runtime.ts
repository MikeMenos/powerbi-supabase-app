export type PowerBiExecuteResponse = {
  results?: Array<{ tables?: Array<{ rows?: Array<Record<string, unknown>> }> }>;
};

export type JoinedSnapshotSourceRow = {
  sellerCode: string | null;
  sellerName: string | null;
  team: string | null;
  group1: string | null;
  group2: string | null;
  group3: string | null;
  month: number | null;
  closedMonthStatus: string | null;
  pbi_query_calc_01: number | null;
  pbi_query_calc_02: number | null;
  pbi_query_calc_03: number | null;
  pbi_query_calc_04: number | null;
};
