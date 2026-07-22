import type {
  ReportQuery,
  ReportQueryGroups,
  ReportQueryTriple,
  ReportQueryType,
  StoredReportQueryType,
} from "@/lib/reports/types/reportQueries";

const REPORT_QUERY_TYPES: ReportQueryType[] = ["VCYTCY", "VLY", "VTREND"];
const REPORT_CODE_SUFFIX = /-(?:VCYTCY|VCYTRCY|VLY|VTREND)$/i;

export function normalizeReportQueryType(
  value: StoredReportQueryType,
  reportCode: string,
): ReportQueryType | null {
  const normalized = value.trim().toUpperCase();

  if (normalized === "CY" || normalized === "VCYTCY") return "VCYTCY";
  if (normalized === "LY" || normalized === "VLY") return "VLY";
  if (normalized === "TREND" || normalized === "VTREND") return "VTREND";

  const suffix = reportCode.toUpperCase().match(REPORT_CODE_SUFFIX)?.[0];
  if (suffix === "-VCYTCY" || suffix === "-VCYTRCY") return "VCYTCY";
  if (suffix === "-VLY") return "VLY";
  if (suffix === "-VTREND") return "VTREND";

  return null;
}

export function getReportCodeBase(reportCode: string) {
  return reportCode.replace(REPORT_CODE_SUFFIX, "");
}

export function groupReportQueries(queries: ReportQuery[]): ReportQueryGroups {
  const grouped = new Map<
    string,
    {
      reportBase: string;
      queries: Partial<Record<ReportQueryType, ReportQuery>>;
    }
  >();

  for (const query of queries) {
    const reportBase = getReportCodeBase(query.report_code);
    const key = `${query.page_code ?? ""}::${reportBase}`;
    const group = grouped.get(key) ?? { reportBase, queries: {} };
    group.queries[query.report_type] = query;
    grouped.set(key, group);
  }

  const complete: ReportQueryTriple[] = [];
  const incomplete: ReportQueryGroups["incomplete"] = [];

  for (const [key, group] of grouped) {
    const missingTypes = REPORT_QUERY_TYPES.filter(
      (reportType) => !group.queries[reportType],
    );

    if (!missingTypes.length) {
      complete.push(group.queries as ReportQueryTriple);
      continue;
    }

    incomplete.push({
      key,
      reportBase: group.reportBase,
      missingTypes,
      queries: group.queries,
    });
  }

  return { complete, incomplete };
}

export function selectQueryTriplesByDataset(
  triples: ReportQueryTriple[],
  datasetIds: string[] | undefined,
) {
  const selected = new Set(datasetIds?.map((id) => id.trim()).filter(Boolean));
  if (!selected.size) return triples;

  return triples.filter((triple) =>
    REPORT_QUERY_TYPES.some((type) => {
      const datasetId = triple[type].dataset_id;
      return datasetId != null && selected.has(datasetId);
    }),
  );
}

export function describeIncompleteQueryGroups(
  groups: ReportQueryGroups["incomplete"],
) {
  return groups
    .map(
      (group) =>
        `${group.reportBase} (missing ${group.missingTypes.join(", ")})`,
    )
    .join("; ");
}

export type ReportQueryTripletSummary = {
  key: string;
  pageCode: string;
  reportBase: string;
  reportPage: string | null;
  presentTypes: ReportQueryType[];
  missingTypes: ReportQueryType[];
  complete: boolean;
  queryCount: number;
};

/** Group raw report_queries rows into triplet summaries for the dashboard UI. */
export function summarizeReportQueryTriplets(
  rows: Array<Record<string, unknown>>,
): ReportQueryTripletSummary[] {
  const grouped = new Map<
    string,
    {
      pageCode: string;
      reportBase: string;
      reportPage: string | null;
      present: Set<ReportQueryType>;
      queryCount: number;
    }
  >();

  for (const row of rows) {
    const reportCode = String(row.report_code ?? "");
    if (!reportCode) continue;

    const reportType = normalizeReportQueryType(
      String(row.report_type ?? ""),
      reportCode,
    );
    if (!reportType) continue;

    const reportBase = getReportCodeBase(reportCode);
    const pageCode = row.page_code == null ? "" : String(row.page_code);
    const key = `${pageCode}::${reportBase}`;
    const existing = grouped.get(key) ?? {
      pageCode,
      reportBase,
      reportPage:
        row.report_page == null ? null : String(row.report_page),
      present: new Set<ReportQueryType>(),
      queryCount: 0,
    };

    existing.present.add(reportType);
    existing.queryCount += 1;
    if (!existing.reportPage && row.report_page != null) {
      existing.reportPage = String(row.report_page);
    }
    grouped.set(key, existing);
  }

  return [...grouped.values()]
    .map((group) => {
      const presentTypes = REPORT_QUERY_TYPES.filter((type) =>
        group.present.has(type),
      );
      const missingTypes = REPORT_QUERY_TYPES.filter(
        (type) => !group.present.has(type),
      );
      return {
        key: `${group.pageCode}::${group.reportBase}`,
        pageCode: group.pageCode,
        reportBase: group.reportBase,
        reportPage: group.reportPage,
        presentTypes,
        missingTypes,
        complete: missingTypes.length === 0,
        queryCount: group.queryCount,
      } satisfies ReportQueryTripletSummary;
    })
    .sort((a, b) => {
      const pageCompare = a.pageCode.localeCompare(b.pageCode);
      if (pageCompare !== 0) return pageCompare;
      return a.reportBase.localeCompare(b.reportBase);
    });
}
