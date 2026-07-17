import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;

  if (!token) {
    return NextResponse.json({ ok: true, authenticated: false });
  }

  const userInfos = decodeUserInfoCookie(jar.get(userCookieName)?.value);

  return NextResponse.json({
    ok: true,
    authenticated: true,
    userInfos,
    user: userInfos
      ? { username: userInfos.username ?? "user" }
      : { username: "user" },
  });
}
