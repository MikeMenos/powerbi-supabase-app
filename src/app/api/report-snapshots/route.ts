import { NextResponse } from "next/server";

import { ensureSnapshot } from "@/lib/reports/snapshotRuntime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const area = url.searchParams.get("area")?.trim() ?? "";
  const pageCode = url.searchParams.get("pageCode")?.trim() ?? "";
  const year = Number(url.searchParams.get("year"));
  const compareYearParam = url.searchParams.get("compareYear");
  const compareYear = compareYearParam == null ? year - 1 : Number(compareYearParam);

  if (
    !area ||
    !pageCode ||
    !Number.isInteger(year) ||
    !Number.isInteger(compareYear)
  ) {
    return NextResponse.json(
      { ok: false, message: "Missing area, pageCode, or year." },
      { status: 400 },
    );
  }

  try {
    const data = await ensureSnapshot({ area, pageCode, year, compareYear });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load snapshot.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
