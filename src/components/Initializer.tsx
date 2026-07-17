"use client";

import { useMemo, useState } from "react";

import LoginForm from "@/components/initializer/LoginForm";
import SessionBar from "@/components/initializer/SessionBar";
import StatusCounts from "@/components/initializer/StatusCounts";
import StatusMessage from "@/components/initializer/StatusMessage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthMe, useInitializationStatus } from "@/hooks/useAuth";
import type { AuthMeSuccess } from "@/types/auth";
import type { InitializationStatus } from "@/types/initialization";

type InitializerProps = {
  initialStatus: InitializationStatus;
  initialAuth: {
    authenticated: boolean;
    username: string | null;
  };
};

export default function Initializer({
  initialStatus,
  initialAuth,
}: InitializerProps) {
  const [error, setError] = useState<string | null>(null);
  const [completedNow, setCompletedNow] = useState(false);
  const authInitialData = useMemo<AuthMeSuccess>(
    () => ({
      ok: true,
      authenticated: initialAuth.authenticated,
      user: { username: initialAuth.username ?? undefined },
    }),
    [initialAuth.authenticated, initialAuth.username],
  );
  const authQuery = useAuthMe();
  const statusQuery = useInitializationStatus();
  const auth = authQuery.data ?? authInitialData;
  const status = statusQuery.data ?? initialStatus;
  const username = auth.userInfos?.username ?? auth.user?.username ?? "user";

  return (
    <main className="grid min-h-dvh place-items-center p-4 sm:p-6">
      <Card className="w-full max-w-xl overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle>Power BI Supabase Initializer</CardTitle>
          <CardDescription>
            Checks Power BI workspaces and their datasets using the AMSA
            session.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {auth.authenticated ? (
            <SessionBar username={username} onError={setError} />
          ) : null}

          <StatusMessage
            authenticated={auth.authenticated}
            completedNow={completedNow}
            error={error}
            status={status}
          />

          {auth.authenticated ? (
            <StatusCounts status={status} />
          ) : (
            <div className="grid gap-4">
              <LoginForm onCompleted={setCompletedNow} onError={setError} />
              <p className="text-sm leading-6 text-muted-foreground">
                Login uses the same AMSA session flow as colai-sales. The
                server calls the Power BI workspaces endpoint and each
                workspace&apos;s datasets endpoint.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
