import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAreaCategoryTargetsQuery,
  findAreaCategoryTargetsRow,
  getAvailableReportPageCodes,
  isReportPageAvailableForArea,
  normalizeAreaCategoryTargetsRows,
} from "../src/lib/reports/areaCategoryTargets.ts";

test("builds the same area target measures used by colai-sales", () => {
  const query = buildAreaCategoryTargetsQuery();

  assert.match(query, /\[WC Total Target\]/);
  assert.match(query, /\[CC TARGET ALL\]/);
  assert.match(query, /\[Sales Target Amoena\]/);
  assert.match(query, /\[Sales Target Abbott\]/);
  assert.match(query, /\[SALES TARGET PORGES\]/);
  assert.match(query, /\[Covidien Sales Target\]/);
});

test("normalizes and matches Power BI target rows by area", () => {
  const records = normalizeAreaCategoryTargetsRows({
    results: [
      {
        tables: [
          {
            rows: [
              {
                "[Area]": "Αττική",
                "[coloplast-travma]": 100,
                "[coloplast-akrateia]": null,
                "[amoena]": 0,
                "[abbott]": 25,
                "[porges]": null,
                "[covidien]": 50,
              },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(findAreaCategoryTargetsRow(records, "  αττική "), records[0]);
  assert.equal(records[0].amoena, 0);
});

test("offers mapped pages for every non-null target, including zero", () => {
  const record = {
    area: "Αττική",
    "coloplast-travma": 100,
    "coloplast-akrateia": null,
    amoena: 0,
    abbott: 25,
    porges: null,
    covidien: 50,
  };
  const pages = getAvailableReportPageCodes(record);

  assert.deepEqual(pages, [
    "coloplast-reports",
    "amoena-reports",
    "covidien-reports",
  ]);
  assert.equal(
    isReportPageAvailableForArea(record, "amoena-reports"),
    true,
  );
  assert.equal(isReportPageAvailableForArea(record, "BBM-reports"), false);
});
