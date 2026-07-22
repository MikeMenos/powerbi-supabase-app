export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const initializationKeys = {
  all: ["initialization"] as const,
  status: () => [...initializationKeys.all, "status"] as const,
};

export const reportKeys = {
  all: ["reports"] as const,
  areas: () => [...reportKeys.all, "areas"] as const,
  areaCategoryTargets: (area: string) =>
    [...reportKeys.all, "area-category-targets", area] as const,
  queries: () => [...reportKeys.all, "queries"] as const,
  snapshot: (
    area: string,
    pageCode: string,
    year: number,
    compareYear?: number,
  ) =>
    [
      ...reportKeys.all,
      "snapshot",
      area,
      pageCode,
      year,
      ...(compareYear == null ? [] : [compareYear]),
    ] as const,
};

export const tableKeys = {
  all: ["tables"] as const,
  summary: () => [...tableKeys.all, "summary"] as const,
  list: (
    table: string,
    page: number,
    pageSize: number,
    search: string,
    filters?: Record<string, string>,
    reportCodeBase?: string,
  ) =>
    [
      ...tableKeys.all,
      "list",
      table,
      page,
      pageSize,
      search,
      filters ?? null,
      reportCodeBase ?? null,
    ] as const,
  columns: (table: string) => [...tableKeys.all, "columns", table] as const,
  fkOptions: (table: string, valueKey = "id", labelKey = "id", descriptionKey = "") =>
    [
      ...tableKeys.all,
      "fk-options",
      table,
      valueKey,
      labelKey,
      descriptionKey,
    ] as const,
  reportQueryTriplets: () =>
    [...tableKeys.all, "report-query-triplets"] as const,
};
