import { NextResponse } from "next/server";

import { initializePowerBiTables } from "@/lib/sync";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";

  if (username.length < 2 || password.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Enter valid AMSA credentials." },
      { status: 400 },
    );
  }

  try {
    const result = await initializePowerBiTables(username, password);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Initialization failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
