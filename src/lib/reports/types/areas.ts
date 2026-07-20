export type PowerBiSellerRow = {
  sellerCode: string;
  salesPerson: string;
  team: string;
  area: string;
};

export type ReportAreasResponse =
  | {
      ok: true;
      areas: string[];
      records: PowerBiSellerRow[];
    }
  | { ok: false; message: string };
