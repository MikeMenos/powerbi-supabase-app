import assert from "node:assert/strict";
import test from "node:test";

import {
  describeLargestSnapshotRatio,
  sanitizeLegacySnapshotRatios,
} from "../src/lib/reports/snapshotDiagnostics.ts";

test("describes the largest snapshot ratio with row identity", () => {
  const detail = describeLargestSnapshotRatio([
    {
      report_code: "P05VALL-VCYTCY",
      seller_code: "100",
      group1: "A",
      group2: "B",
      month: 4,
      react_calc_01: 1.2,
      react_calc_03: 12500.25,
      react_calc_06: null,
    },
  ]);

  assert.equal(
    detail,
    "react_calc_03=12500.25, report=P05VALL-VCYTCY, seller=100, group1=A, group2=B, month=4",
  );
});

test("nulls only ratios that cannot fit the legacy numeric columns", () => {
  const input = [
    {
      pbi_query_calc_01: 25_000_000,
      react_calc_01: 1.234567,
      react_calc_03: 10_000.1,
      react_calc_06: -12_500,
    },
  ];
  const result = sanitizeLegacySnapshotRatios(input);

  assert.deepEqual(result.rows, [
    {
      pbi_query_calc_01: 25_000_000,
      react_calc_01: 1.2346,
      react_calc_03: null,
      react_calc_06: null,
    },
  ]);
  assert.equal(result.changedCount, 3);
  assert.equal(input[0].react_calc_03, 10_000.1);
});
