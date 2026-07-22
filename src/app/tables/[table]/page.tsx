import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReportQueriesBrowser } from "@/components/dashboard/ReportQueriesBrowser";
import { TableBrowser } from "@/components/dashboard/TableBrowser";
import { WorkbookPagesBrowser } from "@/components/dashboard/WorkbookPagesBrowser";
import { Skeleton } from "@/components/ui/skeleton";
import { isDashboardTableId } from "@/lib/dashboard/tableCatalog";

type PageProps = {
  params: Promise<{ table: string }>;
};

function TableBrowserFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function TablePage({ params }: PageProps) {
  const { table: rawTable } = await params;
  if (!isDashboardTableId(rawTable)) notFound();

  return (
    <DashboardShell>
      {rawTable === "workbook_pages" ? (
        <Suspense fallback={<TableBrowserFallback />}>
          <WorkbookPagesBrowser />
        </Suspense>
      ) : rawTable === "report_queries" ? (
        <Suspense fallback={<TableBrowserFallback />}>
          <ReportQueriesBrowser />
        </Suspense>
      ) : (
        <TableBrowser table={rawTable} />
      )}
    </DashboardShell>
  );
}
