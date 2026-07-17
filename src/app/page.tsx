import Initializer from "@/components/Initializer";
import { cookieName, decodeUserInfoCookie, userCookieName } from "@/lib/auth";
import { getInitializationStatus } from "@/lib/sync";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [status, jar] = await Promise.all([
    getInitializationStatus(),
    cookies(),
  ]);
  const authenticated = Boolean(jar.get(cookieName)?.value);
  const userInfos = decodeUserInfoCookie(jar.get(userCookieName)?.value);

  return (
    <Initializer
      initialStatus={status}
      initialAuth={{
        authenticated,
        username: userInfos?.username ?? null,
      }}
    />
  );
}
