"use client";

import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { LoginScreen } from "@/components/dashboard/LoginScreen";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMe, useLogout } from "@/hooks/useAuth";

type DashboardShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function DashboardShell({
  children,
  title,
  description,
}: DashboardShellProps) {
  const auth = useAuthMe();
  const logout = useLogout();

  if (auth.isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    );
  }

  if (!auth.data?.authenticated) {
    return <LoginScreen />;
  }

  const userInfos = auth.data.userInfos;
  const displayName =
    [userInfos?.fname, userInfos?.lname].filter(Boolean).join(" ").trim() ||
    userInfos?.username ||
    null;

  return (
    <SidebarProvider className="min-h-dvh">
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          {title ? (
            <>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-semibold">{title}</h1>
                {description ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex-1" />
          )}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {displayName ? (
              <p className="hidden truncate text-[15px] text-muted-foreground sm:block">
                {displayName}
              </p>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="text-[15px] hover:bg-[#F1F5FF] hover:text-[#415CD6]"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut />
              <span className="hidden sm:inline">
                {logout.isPending ? "Signing out..." : "Logout"}
              </span>
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-background p-4 md:p-6">
          {children}
        </div>
        <footer className="shrink-0 bg-background px-4 py-6 text-center text-sm text-foreground md:px-6">
          Copyright © 2026 mavrogenis sales - WebApp{" "}
          <a
            href="https://nostosenterprises.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#415CD6] hover:underline"
          >
            BI AI SYS WORKS
          </a>
          . All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
