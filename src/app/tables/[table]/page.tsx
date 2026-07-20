import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TableBrowser } from "@/components/dashboard/TableBrowser";
import {
  getTableDef,
  isDashboardTableId,
} from "@/lib/dashboard/tableCatalog";

type PageProps = {
  params: Promise<{ table: string }>;
};

export default async function TablePage({ params }: PageProps) {
  const { table: rawTable } = await params;
  if (!isDashboardTableId(rawTable)) notFound();

  const table = getTableDef(rawTable);

  return (
    <DashboardShell title={table.name} description={table.description}>
      <TableBrowser table={rawTable} />
    </DashboardShell>
  );
}
