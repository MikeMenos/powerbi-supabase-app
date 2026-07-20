import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase";
import { normalizeReportQueryType } from "@/lib/reports/queryGrouping";
import type {
  ReportPageOption,
  ReportQuery,
  StoredReportQuery,
} from "@/lib/reports/types/reportQueries";

export async function listReportQueries() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("report_queries")
    .select("*")
    .eq("is_active", true)
    .order("page_code")
    .order("report_code");

  if (error) throw new Error(`Failed to load report queries: ${error.message}`);

  const queries = ((data ?? []) as StoredReportQuery[]).map((query) => {
    const reportType = normalizeReportQueryType(
      query.report_type,
      query.report_code,
    );
    if (!reportType) {
      throw new Error(
        `Unsupported report_type "${query.report_type}" for ${query.report_code}.`,
      );
    }

    return { ...query, report_type: reportType } satisfies ReportQuery;
  });
  const pageMap = new Map<string, ReportPageOption>();

  for (const query of queries) {
    if (!query.page_code) continue;
    const page = pageMap.get(query.page_code) ?? {
      pageCode: query.page_code,
      reportPage: query.report_page,
      reportPageDesc: query.report_page_desc,
      queryCount: 0,
      datasetIds: [],
      years: [],
    };

    page.queryCount += 1;
    if (query.dataset_id && !page.datasetIds.includes(query.dataset_id)) {
      page.datasetIds.push(query.dataset_id);
    }
    pageMap.set(query.page_code, page);
  }

  const currentYear = new Date().getFullYear();
  return {
    queries,
    pages: [...pageMap.values()].map((page) => ({
      ...page,
      years: [currentYear, currentYear - 1, currentYear - 2],
    })),
  };
}
