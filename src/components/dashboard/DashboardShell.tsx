"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { LoginScreen } from "@/components/dashboard/LoginScreen";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMe } from "@/hooks/useAuth";

type DashboardShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
};

export function DashboardShell({
  children,
  title,
  description,
}: DashboardShellProps) {
  const auth = useAuthMe();

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

  return (
    <SidebarProvider className="min-h-dvh">
      <AppSidebar username={auth.data.user?.username ?? null} />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
