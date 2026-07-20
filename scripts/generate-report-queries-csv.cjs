const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const COLAI_ROOT = "/Users/mike/Downloads/Projects/colai-sales";
const AREA_PLACEHOLDER = "{AREA}";
const OUT_DIR = path.join(process.cwd(), "generated");

const DATASET_IDS = {
  sales: "e928997c-ad45-4320-a7d6-b35a8fa8e510",
  sales_year: "e928997c-ad45-4320-a7d6-b35a8fa8e510",
  area_category_targets: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  akrateia: "e928997c-ad45-4320-a7d6-b35a8fa8e510",
  akrateia_sales_last_year: "5f39f3a4-1245-4510-bbb3-c20b394afd7f",
  akrateia_sales_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  akrateia_trend_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  bbm_sales_last_year: "26e3306d-333c-4383-89b1-736498c0e29e",
  bbm_sales_current_year: "26e3306d-333c-4383-89b1-736498c0e29e",
  bbm_trends_current_year: "26e3306d-333c-4383-89b1-736498c0e29e",
  coloplast_sales_2023: "e928997c-ad45-4320-a7d6-b35a8fa8e510",
  coloplast_sales_last_year: "5f39f3a4-1245-4510-bbb3-c20b394afd7f",
  coloplast_sales_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  coloplast_trend_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  covidien_sales_last_year: "5f39f3a4-1245-4510-bbb3-c20b394afd7f",
  covidien_sales_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  covidien_trend_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  porges_sales_last_year: "5f39f3a4-1245-4510-bbb3-c20b394afd7f",
  porges_sales_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  porges_trend_current_year: "8dcec3c5-33d2-445f-9c1b-fa934a3eec1f",
  amoena_sales_current_year: "3703e49b-ad53-4001-8b5e-2374268d1483",
  amoena_sales_no_currency_current_year:
    "3703e49b-ad53-4001-8b5e-2374268d1483",
  amoena_sales_last_year: "3a917ebc-e44b-4f6c-8b4a-26a76d9b6e02",
  amoena_sales_no_currency_last_year: "3a917ebc-e44b-4f6c-8b4a-26a76d9b6e02",
  amoena_trend_current_year: "3703e49b-ad53-4001-8b5e-2374268d1483",
  amoena_trend_no_currency_current_year:
    "3703e49b-ad53-4001-8b5e-2374268d1483",
};

const PAGE_META = {
  akrateia: {
    report_page: "AKRATEIA",
    business_unit: "COLOPLAST",
    page_code: "akrateia-reports",
    report_page_desc: "AKRATEIA target planning matrix",
  },
  amoena: {
    report_page: "AMOENA",
    business_unit: "AMOENA",
    page_code: "amoena-reports",
    report_page_desc: "AMOENA target planning matrix",
  },
  bbm: {
    report_page: "BBM",
    business_unit: "BAUSCH & LOMB",
    page_code: "BBM-reports",
    report_page_desc: "BAUSCH & LOMB target planning matrix",
  },
  coloplast: {
    report_page: "COLOPLAST",
    business_unit: "COLOPLAST",
    page_code: "coloplast-reports",
    report_page_desc: "COLOPLAST target planning matrix",
  },
  covidien: {
    report_page: "COVIDIEN",
    business_unit: "COVIDIEN",
    page_code: "covidien-reports",
    report_page_desc: "COVIDIEN target planning matrix",
  },
  porges: {
    report_page: "PORGES",
    business_unit: "PORGES",
    page_code: "porges-reports",
    report_page_desc: "PORGES target planning matrix",
  },
};

function csvEscape(value) {
  if (value == null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(fileName, rows, columns) {
  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${csv}\n`, "utf8");
}

function escapeDaxString(value) {
  return value.replaceAll('"', '""');
}

function joinDaxQuery(lines) {
  return lines.join("\n");
}

function buildCalendarYearFilter(yearExpression) {
  return `FILTER('Calendar', 'Calendar'[Year] = ${yearExpression})`;
}

function indentDaxArgs(args) {
  return args.join(",\n  ");
}

function requireStub(request) {
  if (request === "@/lib/bi-reports/powerBi") {
    return {
      buildCalendarYearFilter,
      CURRENT_CALENDAR_YEAR_DAX: "YEAR(TODAY())",
      escapeDaxString,
      indentDaxArgs,
      joinDaxQuery,
      LAST_CALENDAR_YEAR_DAX: "YEAR(TODAY()) - 1",
    };
  }

  if (
    request.includes("/currentYearSales") ||
    request.includes("/lastYearSales") ||
    request.includes("/trendSales")
  ) {
    return {
      normalizeCurrentYearSalesRows: () => [],
      normalizeLastYearSalesRows: () => [],
      normalizeTrendSalesRows: () => [],
    };
  }

  throw new Error(`Unexpected module import: ${request}`);
}

function loadBiReportModule(fileName) {
  const filePath = path.join(COLAI_ROOT, "src/lib/bi-reports", fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  const sandbox = {
    exports: loadedModule.exports,
    module: loadedModule,
    require: requireStub,
  };
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return loadedModule.exports;
}

function extractLiteral(query, key) {
  const match = query.match(
    new RegExp(`"${key}"\\s*,\\s*"((?:[^"]|"")*)"`, "i"),
  );
  return match ? match[1].replaceAll('""', '"') : "";
}

function extractCurrency(query) {
  const match = query.match(/"CURRENCY"\s*,\s*(\d+)|"Currency"\s*,\s*(\d+)/i);
  return match ? Number(match[1] ?? match[2]) : "";
}

function reportTypeFromCode(code) {
  if (code.includes("VTREND")) return "VTREND";
  if (code.includes("VLY")) return "VLY";
  if (code.includes("VCY")) return "VCYTCY";
  return "BASE";
}

function toRow({
  dax_query,
  datasetKey,
  page,
  report_code,
  report_desc,
  report_type,
  currency,
}) {
  const meta = PAGE_META[page];
  return {
    report_page: meta.report_page,
    report_code: report_code || extractLiteral(dax_query, "REPORT_CODE"),
    report_type:
      report_type ||
      reportTypeFromCode(report_code || extractLiteral(dax_query, "REPORT_CODE")),
    report_desc: report_desc || extractLiteral(dax_query, "REPORT_DESC"),
    business_unit: meta.business_unit,
    page_code: meta.page_code,
    report_page_desc: meta.report_page_desc,
    dataset_id: DATASET_IDS[datasetKey] || "",
    dax_query: dax_query
      .replaceAll("YEAR(TODAY()) - 1", "{COMPARE_YEAR}")
      .replaceAll("YEAR(TODAY())", "{CURRENT_YEAR}"),
    currency: currency !== undefined ? currency : extractCurrency(dax_query),
    is_active: true,
  };
}

function addQuery(rows, page, datasetKey, query, overrides = {}) {
  rows.push(
    toRow({
      page,
      datasetKey,
      dax_query: query,
      ...overrides,
    }),
  );
}

function main() {
  const rows = [];
  const amoena = loadBiReportModule("amoena.ts");
  const bbm = loadBiReportModule("bbm.ts");
  const porges = loadBiReportModule("porges.ts");
  const covidien = loadBiReportModule("covidien.ts");
  const coloplast = loadBiReportModule("coloplast.ts");
  const akrateia = loadBiReportModule("akrateia.ts");

  addQuery(
    rows,
    "amoena",
    "amoena_sales_current_year",
    amoena.buildAmoenaSalesCurrentYearQuery(AREA_PLACEHOLDER),
  );
  addQuery(
    rows,
    "amoena",
    "amoena_sales_no_currency_current_year",
    amoena.buildAmoenaSalesNoCurrencyCurrentYearQuery(AREA_PLACEHOLDER),
  );
  addQuery(
    rows,
    "amoena",
    "amoena_sales_last_year",
    amoena.buildAmoenaSalesLastYearQuery(AREA_PLACEHOLDER),
  );
  addQuery(
    rows,
    "amoena",
    "amoena_sales_no_currency_last_year",
    amoena.buildAmoenaSalesNoCurrencyLastYearQuery(AREA_PLACEHOLDER),
  );
  addQuery(
    rows,
    "amoena",
    "amoena_trend_current_year",
    amoena.buildAmoenaTrendCurrentYearQuery(AREA_PLACEHOLDER),
  );
  addQuery(
    rows,
    "amoena",
    "amoena_trend_no_currency_current_year",
    amoena.buildAmoenaTrendNoCurrencyCurrentYearQuery(AREA_PLACEHOLDER),
  );

  addQuery(rows, "bbm", "bbm_sales_last_year", bbm.buildBbmSalesLastYearQuery(AREA_PLACEHOLDER), { currency: 1 });
  addQuery(rows, "bbm", "bbm_sales_current_year", bbm.buildBbmSalesCurrentYearQuery(AREA_PLACEHOLDER), { currency: 1 });
  addQuery(rows, "bbm", "bbm_trends_current_year", bbm.buildBbmTrendQuery(AREA_PLACEHOLDER));

  addQuery(rows, "porges", "porges_sales_last_year", porges.buildPorgesSalesLastYearQuery(AREA_PLACEHOLDER));
  addQuery(rows, "porges", "porges_sales_current_year", porges.buildPorgesSalesQuery(AREA_PLACEHOLDER));
  addQuery(rows, "porges", "porges_trend_current_year", porges.buildPorgesTrendQuery(AREA_PLACEHOLDER));

  addQuery(rows, "covidien", "covidien_sales_last_year", covidien.buildCovidienSalesLastYearQuery(AREA_PLACEHOLDER));
  addQuery(rows, "covidien", "covidien_sales_current_year", covidien.buildCovidienSalesQuery(AREA_PLACEHOLDER));
  addQuery(rows, "covidien", "covidien_trend_current_year", covidien.buildCovidienTrendQuery(AREA_PLACEHOLDER));

  for (const spec of coloplast.buildColoplastSalesCurrentYearQueries(AREA_PLACEHOLDER)) {
    addQuery(rows, "coloplast", spec.targetKey, spec.query);
  }
  for (const spec of coloplast.buildColoplastSalesLastYearQueries(AREA_PLACEHOLDER)) {
    addQuery(rows, "coloplast", spec.targetKey, spec.query);
  }
  for (const spec of coloplast.buildColoplastTrendCurrentYearQueries(AREA_PLACEHOLDER)) {
    addQuery(rows, "coloplast", spec.targetKey, spec.query);
  }

  for (const query of akrateia.buildAkrateiaSalesCurrentYearQueries(AREA_PLACEHOLDER)) {
    addQuery(rows, "akrateia", "akrateia_sales_current_year", query);
  }
  for (const query of akrateia.buildAkrateiaSalesLastYearQueries(AREA_PLACEHOLDER)) {
    addQuery(rows, "akrateia", "akrateia_sales_last_year", query);
  }
  for (const query of akrateia.buildAkrateiaTrendCurrentYearQueries(AREA_PLACEHOLDER)) {
    addQuery(rows, "akrateia", "akrateia_trend_current_year", query);
  }

  rows.sort((a, b) =>
    `${a.report_page}:${a.report_code}`.localeCompare(
      `${b.report_page}:${b.report_code}`,
    ),
  );

  const uniqueKeys = new Set(
    rows.map((row) => `${row.report_page}::${row.report_code}`),
  );
  if (uniqueKeys.size !== rows.length) {
    throw new Error("Duplicate (report_page, report_code) rows detected.");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const columns = [
    "report_page",
    "report_code",
    "report_type",
    "report_desc",
    "business_unit",
    "page_code",
    "report_page_desc",
    "dataset_id",
    "dax_query",
    "currency",
    "is_active",
  ];
  writeCsv("report_queries.csv", rows, columns);
  for (const reportPage of [...new Set(rows.map((row) => row.report_page))]) {
    writeCsv(
      `report_queries_${reportPage.toLowerCase().replaceAll(" ", "_")}.csv`,
      rows.filter((row) => row.report_page === reportPage),
      columns,
    );
  }
  writeCsv(
    "report_queries_field_mapping.csv",
    [
      {
        column: "report_page",
        source: "Power BI page/category label from colai-sales page components",
      },
      {
        column: "report_code",
        source: 'DAX literal "REPORT_CODE"',
      },
      {
        column: "report_type",
        source: "Derived from report_code suffix: VCY/VCYTCY/VCYTRCY -> VCYTCY, VLY -> VLY, VTREND -> VTREND",
      },
      {
        column: "report_desc",
        source: 'DAX literal "REPORT_DESC"',
      },
      {
        column: "business_unit",
        source: "Report page/category business unit",
      },
      {
        column: "page_code",
        source: "Next route segment under /powerbi",
      },
      {
        column: "report_page_desc",
        source: "Caption/description from page component",
      },
      {
        column: "dataset_id",
        source: "resolveBiReportPowerBiTarget dataset id constants",
      },
      {
        column: "dax_query",
        source: "Generated by original joinDaxQuery builders with {AREA}, {CURRENT_YEAR}, {COMPARE_YEAR} placeholders",
      },
      {
        column: "currency",
        source: 'DAX literal "CURRENCY"/"Currency"; inferred 1 for BBM sales rows without explicit literal',
      },
    ],
    ["column", "source"],
  );
  const countsByPage = rows.reduce((counts, row) => {
    counts[row.report_page] = (counts[row.report_page] || 0) + 1;
    return counts;
  }, {});
  console.log(`Wrote ${rows.length} rows to generated/report_queries.csv`);
  console.log(JSON.stringify(countsByPage, null, 2));
}

main();
