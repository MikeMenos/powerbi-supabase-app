"use client";

import {
  BookOpen,
  CalendarDays,
  Code2,
  Database,
  FileText,
  Home,
  Layers3,
  Table2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TABLE_CATALOG, TABLE_IDS } from "@/lib/dashboard/tableCatalog";
import type { DashboardTableId } from "@/lib/dashboard/types/tables";
import { cn } from "@/lib/utils";

const tableIcons: Record<DashboardTableId, typeof Database> = {
  powerbi_groups: Layers3,
  powerbi_datasets: Database,
  workbooks: BookOpen,
  workbook_pages: FileText,
  report_queries: Code2,
  sales_snapshots: Table2,
  v_available_snapshots: CalendarDays,
};

const navItemClassName = cn(
  "h-auto py-2 text-[15px] text-[#9DA6B8]",
  "hover:bg-transparent hover:text-[#415CD6]",
  "active:bg-transparent active:text-[#415CD6]",
  "data-[active=true]:bg-transparent data-[active=true]:font-medium data-[active=true]:text-[#415CD6]",
  "data-[state=open]:hover:bg-transparent data-[state=open]:hover:text-[#415CD6]",
);

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center border-b border-sidebar-border py-4">
        <Link
          href="/"
          className="mx-2 flex w-[calc(100%-1rem)] items-center justify-center rounded-md bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-1.5"
          aria-label="Home"
        >
          <Image
            src={logo}
            alt="Mavrogenis"
            priority
            className="h-auto w-[min(160px,100%)] group-data-[collapsible=icon]:w-8"
          />
        </Link>
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
                  className={navItemClassName}
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
                      className={navItemClassName}
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
      <SidebarRail />
    </Sidebar>
  );
}
