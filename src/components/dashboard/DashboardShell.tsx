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
  title: string;
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

  const username = auth.data.user?.username ?? null;

  return (
    <SidebarProvider className="min-h-dvh">
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {username ? (
              <p className="hidden truncate text-[15px] text-muted-foreground sm:block">
                {username}
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
      </SidebarInset>
    </SidebarProvider>
  );
}
