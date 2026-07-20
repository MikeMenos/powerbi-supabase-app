import "server-only";

import { cookies } from "next/headers";

import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";

export async function requireAmsaSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) throw new Error("Not authenticated.");

  return {
    token,
    user: decodeUserInfoCookie(jar.get(userCookieName)?.value),
  };
}
