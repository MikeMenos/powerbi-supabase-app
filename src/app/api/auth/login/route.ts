import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  cookieName,
  encodeUserInfoCookie,
  userCookieName,
} from "@/lib/auth";
import { authenticateWithAmsa } from "@/lib/powerBi";
import { initializePowerBiTablesForSession } from "@/lib/sync";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  const username = (body?.username ?? "").trim();
  const password = body?.password ?? "";

  if (username.length < 2 || password.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Invalid credentials payload." },
      { status: 400 },
    );
  }

  try {
    const data = await authenticateWithAmsa(username, password);
    const token = data.accessToken;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: data.message ?? "Login failed." },
        { status: 401 },
      );
    }

    const initialization = await initializePowerBiTablesForSession(token);
    const jar = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: data.expiresIn ?? undefined,
    };

    jar.set(cookieName, token, cookieOptions);

    const userCookieValue = data.userInfos
      ? encodeUserInfoCookie(data.userInfos)
      : null;
    if (userCookieValue) {
      jar.set(userCookieName, userCookieValue, cookieOptions);
    }

    return NextResponse.json({ ok: true, ...data, initialization });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
