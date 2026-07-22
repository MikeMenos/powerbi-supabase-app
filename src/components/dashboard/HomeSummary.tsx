"use client";

import {
  BookOpen,
  CalendarDays,
  Code2,
  Database,
  FileText,
  Layers3,
  Table2,
} from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableSummaries } from "@/hooks/useTables";
import { TABLE_IDS } from "@/lib/dashboard/tableCatalog";
import type { DashboardTableId } from "@/lib/dashboard/types/tables";

const icons: Record<DashboardTableId, typeof Database> = {
  powerbi_groups: Layers3,
  powerbi_datasets: Database,
  workbooks: BookOpen,
  workbook_pages: FileText,
  report_queries: Code2,
  sales_snapshots: Table2,
  v_available_snapshots: CalendarDays,
};

export function HomeSummary() {
  const summaries = useTableSummaries();

  if (summaries.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TABLE_IDS.map((tableId) => (
          <Card key={tableId}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (summaries.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load tables</CardTitle>
          <CardDescription>
            {summaries.error instanceof Error
              ? summaries.error.message
              : "Unknown error"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {(summaries.data ?? []).map((table) => {
        const Icon = icons[table.id];
        return (
          <Link key={table.id} href={`/tables/${table.id}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/40">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">{table.name}</CardTitle>
                  <CardDescription>{table.description}</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-md border-border bg-background p-2 text-muted-foreground"
                >
                  <Icon className="size-4" />
                </Badge>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {table.count.toLocaleString()}
                </CardTitle>
                <CardDescription className="mt-1">total rows</CardDescription>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
