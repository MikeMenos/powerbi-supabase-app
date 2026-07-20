import type { PowerBiExecuteResponse } from "@/lib/reports/types/runtime";
import type {
  AreaCategoryTargetsRow,
  ReportCategoryTargetKey,
} from "@/lib/reports/types/areaCategoryTargets";

export const AREA_CATEGORY_TARGET_KEYS: ReportCategoryTargetKey[] = [
  "coloplast-travma",
  "coloplast-akrateia",
  "amoena",
  "abbott",
  "porges",
  "covidien",
];

const TARGET_PAGE_CODES: Partial<Record<ReportCategoryTargetKey, string>> = {
  "coloplast-travma": "coloplast-reports",
  "coloplast-akrateia": "akrateia-reports",
  amoena: "amoena-reports",
  porges: "porges-reports",
  covidien: "covidien-reports",
};

function readValue(row: Record<string, unknown>, key: string) {
  return row[`[${key}]`] ?? row[key];
}

function readString(row: Record<string, unknown>, key: string) {
  return String(readValue(row, key) ?? "").trim();
}

function readNumber(row: Record<string, unknown>, key: string) {
  const value = readValue(row, key);
  if (value == null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeArea(area: string | null | undefined) {
  return String(area ?? "")
    .trim()
    .toLocaleUpperCase("el-GR");
}

export function buildAreaCategoryTargetsQuery() {
  return [
    "DEFINE",
    "VAR __Base = SUMMARIZECOLUMNS(",
    "  'U Sales Person'[Area],",
    '  "coloplast-travma", ROUND([WC Total Target], 0),',
    '  "coloplast-akrateia", ROUND([CC TARGET ALL], 0),',
    '  "amoena", ROUND([Sales Target Amoena], 0),',
    '  "abbott", ROUND([Sales Target Abbott], 0),',
    '  "porges", ROUND([SALES TARGET PORGES], 0),',
    '  "covidien", ROUND([Covidien Sales Target], 0)',
    ")",
    "EVALUATE",
    "SELECTCOLUMNS(",
    "  __Base,",
    '  "Area", \'U Sales Person\'[Area],',
    '  "coloplast-travma", [coloplast-travma],',
    '  "coloplast-akrateia", [coloplast-akrateia],',
    '  "amoena", [amoena],',
    '  "abbott", [abbott],',
    '  "porges", [porges],',
    '  "covidien", [covidien]',
    ")",
    "ORDER BY [Area]",
  ].join("\n");
}

export function normalizeAreaCategoryTargetsRows(
  response: PowerBiExecuteResponse,
): AreaCategoryTargetsRow[] {
  const rows = response.results?.[0]?.tables?.[0]?.rows ?? [];

  return rows.map((row) => ({
    area: readString(row, "Area"),
    "coloplast-travma": readNumber(row, "coloplast-travma"),
    "coloplast-akrateia": readNumber(row, "coloplast-akrateia"),
    amoena: readNumber(row, "amoena"),
    abbott: readNumber(row, "abbott"),
    porges: readNumber(row, "porges"),
    covidien: readNumber(row, "covidien"),
  }));
}

export function findAreaCategoryTargetsRow(
  rows: AreaCategoryTargetsRow[],
  area: string,
) {
  const target = normalizeArea(area);
  if (!target) return null;
  return rows.find((row) => normalizeArea(row.area) === target) ?? null;
}

export function getAvailableReportPageCodes(
  record: AreaCategoryTargetsRow | null,
) {
  if (!record) return [];

  return AREA_CATEGORY_TARGET_KEYS.flatMap((key) => {
    const pageCode = TARGET_PAGE_CODES[key];
    return pageCode && record[key] != null ? [pageCode] : [];
  });
}

export function isReportPageAvailableForArea(
  record: AreaCategoryTargetsRow | null,
  pageCode: string,
) {
  return getAvailableReportPageCodes(record).includes(pageCode);
}
