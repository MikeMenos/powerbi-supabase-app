import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { cookieName, userCookieName } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  jar.set(cookieName, "", { path: "/", maxAge: 0 });
  jar.set(userCookieName, "", { path: "/", maxAge: 0 });

  return NextResponse.json({ ok: true });
}
