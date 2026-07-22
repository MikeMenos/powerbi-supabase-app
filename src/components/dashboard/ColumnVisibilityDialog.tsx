"use client";

import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  isColumnVisibilityLocked,
  resolveHiddenColumnKeys,
} from "@/lib/dashboard/columnVisibility";
import type {
  ColumnDef,
  DashboardTableId,
} from "@/lib/dashboard/types/tables";
import {
  useColumnVisibilityStore,
  useStoredHiddenColumnKeys,
} from "@/stores/columnVisibilityStore";

type ColumnVisibilityDialogProps = {
  table: DashboardTableId;
  columns: ColumnDef[];
};

export function ColumnVisibilityDialog({
  table,
  columns,
}: ColumnVisibilityDialogProps) {
  const [open, setOpen] = useState(false);
  const storedHiddenKeys = useStoredHiddenColumnKeys(table);
  const setColumnHidden = useColumnVisibilityStore(
    (state) => state.setColumnHidden,
  );
  const showAllColumns = useColumnVisibilityStore(
    (state) => state.showAllColumns,
  );

  const hiddenKeys = useMemo(
    () => resolveHiddenColumnKeys(columns, storedHiddenKeys),
    [columns, storedHiddenKeys],
  );
  const hiddenSet = useMemo(() => new Set(hiddenKeys), [hiddenKeys]);

  const toggleableColumns = useMemo(
    () => columns.filter((column) => !isColumnVisibilityLocked(column)),
    [columns],
  );

  const hiddenCount = toggleableColumns.filter((column) =>
    hiddenSet.has(column.key),
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye />
          Show / hide columns
          {hiddenCount > 0 ? (
            <Badge variant="secondary">({hiddenCount} hidden)</Badge>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Column visibility</DialogTitle>
          <DialogDescription>
            Choose which columns appear in the table. Your choices are saved
            locally on this device.
          </DialogDescription>
        </DialogHeader>

        <DialogDescription className="flex items-center justify-between gap-2 !mt-0">
          <span>
            {toggleableColumns.length - hiddenCount} of{" "}
            {toggleableColumns.length} columns visible
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={hiddenCount === 0}
            onClick={() => showAllColumns(table)}
          >
            Show all
          </Button>
        </DialogDescription>

        <Table>
          <TableBody>
            {columns.map((column) => {
              const locked = isColumnVisibilityLocked(column);
              const visible = locked || !hiddenSet.has(column.key);

              return (
                <TableRow key={column.key}>
                  <TableCell>
                    <Label
                      className={`flex items-start gap-3 ${
                        locked
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={visible}
                        disabled={locked}
                        onChange={(event) =>
                          setColumnHidden(
                            table,
                            column.key,
                            !event.target.checked,
                            storedHiddenKeys === undefined
                              ? { seedIfUnset: hiddenKeys }
                              : undefined,
                          )
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-medium">
                          {column.label}
                          {!visible ? (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                          ) : null}
                        </span>
                        <DialogDescription className="truncate">
                          {column.key}
                          {locked ? " · always visible" : ""}
                        </DialogDescription>
                      </span>
                    </Label>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
