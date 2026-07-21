"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import { ColumnVisibilityDialog } from "@/components/dashboard/ColumnVisibilityDialog";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { ManageColumnsDialog } from "@/components/dashboard/ManageColumnsDialog";
import { RowFormDialog } from "@/components/dashboard/RowFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as UiTableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCreateTableRow,
  useDeleteTableRow,
  useTableColumns,
  useTableRows,
  useUpdateTableRow,
} from "@/hooks/useTables";
import { getApiErrorMessage } from "@/lib/api/client";
import { filterVisibleListColumns } from "@/lib/dashboard/columnVisibility";
import {
  getListColumnsFromDefs,
  getTableDef,
} from "@/lib/dashboard/tableCatalog";
import type {
  DashboardTableId,
  TableRow,
} from "@/lib/dashboard/types/tables";
import { useColumnVisibilityStore, useHiddenColumnKeys } from "@/stores/columnVisibilityStore";
import { toast } from "sonner";

const PAGE_SIZE = 25;

function TruncatedCellValue({ text }: { text: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const updateTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth + 1);
    };

    updateTruncation();

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(element);
    if (element.parentElement) {
      observer.observe(element.parentElement);
    }

    return () => observer.disconnect();
  }, [text]);

  return (
    <Tooltip
      delayDuration={200}
      open={isTruncated ? undefined : false}
    >
      <TooltipTrigger asChild>
        <span
          ref={textRef}
          className={
            isTruncated
              ? "block max-w-full cursor-default truncate"
              : "block max-w-full truncate"
          }
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-md break-all bg-foreground text-background"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function formatCell(value: unknown): ReactNode {
  if (value == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "true" : "false"}
      </Badge>
    );
  }

  return <TruncatedCellValue text={String(value)} />;
}

type TableBrowserProps = {
  table: DashboardTableId;
};

export function TableBrowser({ table }: TableBrowserProps) {
  const def = getTableDef(table);
  const columnsQuery = useTableColumns(table);
  const canCreate = def.canCreate !== false;
  const canEdit = def.canEdit !== false;
  const canDelete = def.canDelete !== false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteRow, setDeleteRow] = useState<TableRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rowsQuery = useTableRows(table, { page, pageSize: PAGE_SIZE, search });
  const createRow = useCreateTableRow(table);
  const updateRow = useUpdateTableRow(table);
  const removeRow = useDeleteTableRow(table);

  const hiddenKeys = useHiddenColumnKeys(table);
  const pruneStaleKeys = useColumnVisibilityStore(
    (state) => state.pruneStaleKeys,
  );

  const schemaColumns = useMemo(
    () => columnsQuery.data?.columns ?? rowsQuery.data?.columns ?? [],
    [columnsQuery.data?.columns, rowsQuery.data?.columns],
  );
  const listColumns = useMemo(
    () => getListColumnsFromDefs(schemaColumns),
    [schemaColumns],
  );
  const displayColumns = useMemo(
    () => filterVisibleListColumns(listColumns, hiddenKeys),
    [listColumns, hiddenKeys],
  );

  useEffect(() => {
    if (listColumns.length === 0) return;
    pruneStaleKeys(
      table,
      listColumns.map((column) => column.key),
    );
  }, [listColumns, pruneStaleKeys, table]);

  const total = rowsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const columnsError =
    columnsQuery.error instanceof Error
      ? columnsQuery.error.message
      : columnsQuery.isError
        ? "Failed to load columns."
        : null;

  function openCreate() {
    if (!canCreate) return;
    setFormMode("create");
    setSelectedRow(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(row: TableRow) {
    if (!canEdit) return;
    setFormMode("edit");
    setSelectedRow(row);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    setFormError(null);
    try {
      if (formMode === "create") {
        if (!canCreate) throw new Error("Create is disabled for this table.");
        await createRow.mutateAsync(values);
        toast.success("Row created");
      } else {
        if (!canEdit) throw new Error("Edit is disabled for this table.");
        const id = String(selectedRow?.id ?? "");
        await updateRow.mutateAsync({ id, body: values });
        toast.success("Row updated");
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Save failed."));
    }
  }

  async function handleDelete() {
    if (!deleteRow?.id || !canDelete) return;
    setDeleteError(null);
    try {
      await removeRow.mutateAsync(String(deleteRow.id));
      setDeleteRow(null);
      toast.success("Row deleted");
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, "Delete failed."));
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{def.name}</CardTitle>
            <CardDescription>{def.description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ColumnVisibilityDialog table={table} columns={listColumns} />
            <ManageColumnsDialog
              table={table}
              columns={schemaColumns}
              addableTypes={columnsQuery.data?.addableTypes ?? []}
            />
            {canCreate ? (
              <Button onClick={openCreate}>
                <Plus />
                Add row
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {columnsQuery.data?.schemaRpcReady === false ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {columnsQuery.data.schemaRpcHint ??
                "Schema RPCs are missing. Run the dashboard schema migration in Supabase to enable add/delete column."}
            </p>
          ) : null}
          {columnsError ? (
            <p className="text-sm text-destructive">{columnsError}</p>
          ) : null}

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Input
              placeholder="Search…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <UiTableRow>
                  {displayColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      className="whitespace-nowrap"
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="sticky right-0 z-10 w-[1%] whitespace-nowrap bg-card text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]">
                    Actions
                  </TableHead>
                </UiTableRow>
              </TableHeader>
              <TableBody>
                {rowsQuery.isLoading || columnsQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <UiTableRow key={index}>
                      {(displayColumns.length > 0
                        ? displayColumns
                        : [{ key: "placeholder" }]
                      ).map((column) => (
                        <TableCell key={column.key}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-card">
                        <Skeleton className="ml-auto h-8 w-16" />
                      </TableCell>
                    </UiTableRow>
                  ))
                ) : rowsQuery.isError ? (
                  <UiTableRow>
                    <TableCell
                      colSpan={Math.max(displayColumns.length, 1) + 1}
                      className="text-destructive"
                    >
                      {rowsQuery.error instanceof Error
                        ? rowsQuery.error.message
                        : "Failed to load rows."}
                    </TableCell>
                  </UiTableRow>
                ) : (rowsQuery.data?.rows.length ?? 0) === 0 ? (
                  <UiTableRow>
                    <TableCell
                      colSpan={Math.max(displayColumns.length, 1) + 1}
                      className="text-muted-foreground"
                    >
                      No rows found.
                    </TableCell>
                  </UiTableRow>
                ) : (
                  rowsQuery.data?.rows.map((row) => (
                    <UiTableRow key={String(row.id)} className="group">
                      {displayColumns.map((column) => (
                        <TableCell key={column.key} className="max-w-[14rem]">
                          {formatCell(row[column.key])}
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-card text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)] group-hover:bg-muted/50">
                        <div className="inline-flex gap-1">
                          {canEdit ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(row)}
                              aria-label="Edit row"
                            >
                              <Pencil />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteRow(row);
                              }}
                              aria-label="Delete row"
                            >
                              <Trash2 />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </UiTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {total.toLocaleString()} row{total === 1 ? "" : "s"}
              {search ? ` matching “${search}”` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || rowsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || rowsQuery.isFetching}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {canCreate || canEdit ? (
        <RowFormDialog
          table={table}
          columns={schemaColumns}
          open={formOpen}
          mode={formMode}
          row={selectedRow}
          pending={createRow.isPending || updateRow.isPending}
          error={formError}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(deleteRow)}
        description={`This permanently deletes the row${
          deleteRow?.id ? ` ${String(deleteRow.id)}` : ""
        }. Related foreign keys may block the delete.`}
        pending={removeRow.isPending}
        error={deleteError}
        onOpenChange={(open) => {
          if (!open) setDeleteRow(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
