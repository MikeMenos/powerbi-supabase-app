export type ReportCategoryTargetKey =
  | "coloplast-travma"
  | "coloplast-akrateia"
  | "amoena"
  | "abbott"
  | "porges"
  | "covidien";

export type AreaCategoryTargetsRow = {
  area: string;
} & Partial<Record<ReportCategoryTargetKey, number | null>>;

export type AreaCategoryTargetsResponse =
  | {
      ok: true;
      area: string;
      record: AreaCategoryTargetsRow | null;
      availablePageCodes: string[];
    }
  | { ok: false; message: string };

export type AreaCategoryTargetsCache = {
  fetchedAt: number;
  records: AreaCategoryTargetsRow[];
};
