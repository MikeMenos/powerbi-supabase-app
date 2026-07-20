"use client";

import {
  BookOpen,
  Code2,
  Database,
  FileText,
  Home,
  Layers3,
  LogOut,
  Table2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useLogout } from "@/hooks/useAuth";
import { TABLE_CATALOG, TABLE_IDS } from "@/lib/dashboard/tableCatalog";
import type { DashboardTableId } from "@/lib/dashboard/types/tables";

const tableIcons: Record<DashboardTableId, typeof Database> = {
  powerbi_groups: Layers3,
  powerbi_datasets: Database,
  workbooks: BookOpen,
  workbook_pages: FileText,
  report_queries: Code2,
  sales_snapshots: Table2,
};

type AppSidebarProps = {
  username?: string | null;
};

export function AppSidebar({ username }: AppSidebarProps) {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Database className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Supabase Admin</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Table dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Home"
                >
                  <Link href="/">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tables</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TABLE_IDS.map((tableId) => {
                const table = TABLE_CATALOG[tableId];
                const Icon = tableIcons[tableId];
                const href = `/tables/${tableId}`;
                return (
                  <SidebarMenuItem key={tableId}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === href}
                      tooltip={table.name}
                    >
                      <Link href={href}>
                        <Icon />
                        <span>{table.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 px-2 group-data-[collapsible=icon]:items-center">
          {username ? (
            <p className="truncate px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              Signed in as {username}
            </p>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut />
            <span className="group-data-[collapsible=icon]:hidden">
              {logout.isPending ? "Signing out..." : "Logout"}
            </span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
