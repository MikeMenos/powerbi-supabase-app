export type ReportQueryType = "VCYTCY" | "VLY" | "VTREND";

export type StoredReportQueryType =
  | ReportQueryType
  | "CY"
  | "LY"
  | "TREND"
  | string;

export type ReportQuery = {
  id: string;
  report_page: string;
  report_code: string;
  report_type: ReportQueryType;
  report_desc: string | null;
  business_unit: string | null;
  page_code: string | null;
  report_page_desc: string | null;
  dataset_id: string | null;
  dax_query: string;
  currency: number | null;
  is_active: boolean | null;
};

export type StoredReportQuery = Omit<ReportQuery, "report_type"> & {
  report_type: StoredReportQueryType;
};

export type ReportQueryTriple = Record<ReportQueryType, ReportQuery>;

export type IncompleteReportQueryGroup = {
  key: string;
  reportBase: string;
  missingTypes: ReportQueryType[];
  queries: Partial<Record<ReportQueryType, ReportQuery>>;
};

export type ReportQueryGroups = {
  complete: ReportQueryTriple[];
  incomplete: IncompleteReportQueryGroup[];
};

export type ReportPageOption = {
  pageCode: string;
  reportPage: string;
  reportPageDesc: string | null;
  queryCount: number;
  datasetIds: string[];
  years: number[];
};

export type ReportQueriesResponse =
  | { ok: true; pages: ReportPageOption[]; queries: ReportQuery[] }
  | { ok: false; message: string };
