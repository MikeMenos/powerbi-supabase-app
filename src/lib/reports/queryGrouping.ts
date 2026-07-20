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
