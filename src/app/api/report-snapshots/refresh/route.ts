import { NextResponse } from "next/server";

import { refreshSnapshot } from "@/lib/reports/snapshotRuntime";
import type { RefreshSnapshotRequest } from "@/lib/reports/types/snapshots";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | RefreshSnapshotRequest
    | null;
  const area = body?.area?.trim() ?? "";
  const pageCode = body?.pageCode?.trim() ?? "";
  const currentYear = Number(body?.currentYear);
  const compareYear = Number(body?.compareYear);
  const queryIds = Array.isArray(body?.queryIds)
    ? body.queryIds
        .map((queryId) => String(queryId).trim())
        .filter(Boolean)
    : undefined;

  if (
    !area ||
    !pageCode ||
    !Number.isInteger(currentYear) ||
    !Number.isInteger(compareYear)
  ) {
    return NextResponse.json(
      { ok: false, message: "Missing refresh input." },
      { status: 400 },
    );
  }

  try {
    const result = await refreshSnapshot({
      area,
      pageCode,
      currentYear,
      compareYear,
      queryIds,
    });
    return NextResponse.json({ ok: true, fromCache: false, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh snapshot.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
