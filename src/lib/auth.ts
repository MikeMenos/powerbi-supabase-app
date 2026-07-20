import "server-only";

import type { ApiUserInfo, SessionUserInfo } from "@/lib/types/auth";

export const cookieName = "session-colai";
export const userCookieName = "amsa_user";

export function toSessionUserInfo(
  userInfos: ApiUserInfo | null | undefined,
): SessionUserInfo | null {
  if (!userInfos || typeof userInfos.userID !== "number") return null;

  return {
    userID: userInfos.userID,
    userUID: userInfos.userUID ?? null,
    username: userInfos.username ?? null,
    fname: userInfos.fname ?? null,
    lname: userInfos.lname ?? null,
    area: userInfos.area ?? null,
    team: userInfos.team ?? null,
    isSuperAdmin: userInfos.isSuperAdmin,
    isSalesAdmin: userInfos.isSalesAdmin,
    isSeller: userInfos.isSeller,
    isManager: userInfos.isManager,
    sellerCode: userInfos.sellerCode ?? null,
    travmaArea: userInfos.travmaArea ?? null,
    travmaTeam: userInfos.travmaTeam ?? null,
  };
}

export function encodeUserInfoCookie(userInfos: ApiUserInfo): string | null {
  const sessionUser = toSessionUserInfo(userInfos);
  if (!sessionUser) return null;

  return Buffer.from(JSON.stringify(sessionUser), "utf8").toString("base64url");
}

export function decodeUserInfoCookie(value?: string): SessionUserInfo | null {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as { userID?: unknown }).userID !== "number"
    ) {
      return null;
    }

    return parsed as SessionUserInfo;
  } catch {
    return null;
  }
}

export async function verifySession(token?: string | null) {
  return Boolean(token);
}
