import { NextResponse } from "next/server";

import { requireAmsaSession } from "@/lib/authSession";

export async function requireDashboardSession() {
  try {
    return await requireAmsaSession();
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { ok: false, message: "Not authenticated." },
    { status: 401 },
  );
}

export function errorResponse(error: unknown, fallback: string, status = 400) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ ok: false, message }, { status });
}
