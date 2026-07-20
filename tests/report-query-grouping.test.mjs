import assert from "node:assert/strict";
import test from "node:test";

import {
  describeIncompleteQueryGroups,
  getReportCodeBase,
  groupReportQueries,
  normalizeReportQueryType,
  selectQueryTriplesByDataset,
} from "../src/lib/reports/queryGrouping.ts";
import { isSnapshotFresh } from "../src/lib/reports/snapshotFreshness.ts";

function query(reportCode, reportType, datasetId, pageCode = "reports") {
  return {
    id: reportCode,
    report_page: "REPORT",
    report_code: reportCode,
    report_type: reportType,
    report_desc: null,
    business_unit: null,
    page_code: pageCode,
    report_page_desc: null,
    dataset_id: datasetId,
    dax_query: "EVALUATE ROW()",
    currency: 0,
    is_active: true,
  };
}

test("normalizes imported aliases and report-code fallbacks", () => {
  assert.equal(normalizeReportQueryType("CY", "P01-VCYTCY"), "VCYTCY");
  assert.equal(normalizeReportQueryType("LY", "P01-VLY"), "VLY");
  assert.equal(normalizeReportQueryType("TREND", "P01-VTREND"), "VTREND");
  assert.equal(normalizeReportQueryType("legacy", "P01-VCYTRCY"), "VCYTCY");
  assert.equal(getReportCodeBase("P06VALL-VCYTRCY"), "P06VALL");
});

test("groups a VCYTRCY current query with VLY and VTREND", () => {
  const grouped = groupReportQueries([
    query("P06VALL-VCYTRCY", "VCYTCY", "all-years"),
    query("P06VALL-VLY", "VLY", "all-years"),
    query("P06VALL-VTREND", "VTREND", "all-years"),
  ]);

  assert.equal(grouped.complete.length, 1);
  assert.equal(grouped.incomplete.length, 0);
  assert.equal(grouped.complete[0].VCYTCY.report_code, "P06VALL-VCYTRCY");
});

test("dataset selection keeps the complete cross-dataset group", () => {
  const grouped = groupReportQueries([
    query("P03V01-VCYTCY", "VCYTCY", "current"),
    query("P03V01-VLY", "VLY", "previous"),
    query("P03V01-VTREND", "VTREND", "current"),
  ]);
  const selected = selectQueryTriplesByDataset(grouped.complete, ["previous"]);

  assert.equal(selected.length, 1);
  assert.equal(selected[0].VCYTCY.dataset_id, "current");
  assert.equal(selected[0].VLY.dataset_id, "previous");
  assert.equal(selected[0].VTREND.dataset_id, "current");
});

test("reports the missing members of incomplete groups", () => {
  const grouped = groupReportQueries([
    query("P05VALL-VCYTCY", "VCYTCY", "current"),
    query("P05VALL-VLY", "VLY", "previous"),
  ]);

  assert.equal(grouped.complete.length, 0);
  assert.match(
    describeIncompleteQueryGroups(grouped.incomplete),
    /P05VALL \(missing VTREND\)/,
  );
});

test("treats only today's snapshot as fresh", () => {
  assert.equal(isSnapshotFresh("2026-07-17", "2026-07-17"), true);
  assert.equal(isSnapshotFresh("2026-07-16", "2026-07-17"), false);
  assert.equal(isSnapshotFresh(null, "2026-07-17"), false);
});
