import { NextResponse } from "next/server";

import { getInitializationStatus } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getInitializationStatus();
    return NextResponse.json(
      { ok: true, ...status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read sync status.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
