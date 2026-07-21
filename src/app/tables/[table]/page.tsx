import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TableBrowser } from "@/components/dashboard/TableBrowser";
import { isDashboardTableId } from "@/lib/dashboard/tableCatalog";

type PageProps = {
  params: Promise<{ table: string }>;
};

export default async function TablePage({ params }: PageProps) {
  const { table: rawTable } = await params;
  if (!isDashboardTableId(rawTable)) notFound();

  return (
    <DashboardShell>
      <TableBrowser table={rawTable} />
    </DashboardShell>
  );
}
