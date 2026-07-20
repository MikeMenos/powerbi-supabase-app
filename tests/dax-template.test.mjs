import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeDaxTemplate,
  renderDaxTemplate,
} from "../src/lib/reports/daxTemplate.ts";

test("canonicalizes the legacy catalog placeholders", () => {
  const query = [
    `'U Sales Person'[Area] = "*areaName*"`,
    `'Calendar'[Year] = YEAR(TODAY()) - 1`,
    `'Calendar'[Year] = YEAR(TODAY())`,
  ].join("\n");

  assert.equal(
    canonicalizeDaxTemplate(query),
    [
      `'U Sales Person'[Area] = "{AREA}"`,
      `'Calendar'[Year] = {COMPARE_YEAR}`,
      `'Calendar'[Year] = {CURRENT_YEAR}`,
    ].join("\n"),
  );
});

test("renders selected area and comparison years into DAX", () => {
  const rendered = renderDaxTemplate(
    `'U Sales Person'[Area] = "{AREA}" && 'Calendar'[Year] IN {{CURRENT_YEAR}, {COMPARE_YEAR}}`,
    { area: 'AREA "NORTH"', currentYear: 2026, compareYear: 2024 },
  );

  assert.equal(
    rendered,
    `'U Sales Person'[Area] = "AREA ""NORTH""" && 'Calendar'[Year] IN {2026, 2024}`,
  );
});
