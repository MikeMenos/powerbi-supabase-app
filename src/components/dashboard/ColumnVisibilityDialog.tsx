"use client";

import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { isColumnVisibilityLocked } from "@/lib/dashboard/columnVisibility";
import type {
  ColumnDef,
  DashboardTableId,
} from "@/lib/dashboard/types/tables";
import {
  useColumnVisibilityStore,
  useHiddenColumnKeys,
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
  const hiddenKeys = useHiddenColumnKeys(table);
  const setColumnHidden = useColumnVisibilityStore(
    (state) => state.setColumnHidden,
  );
  const showAllColumns = useColumnVisibilityStore(
    (state) => state.showAllColumns,
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
            <span className="text-muted-foreground">({hiddenCount} hidden)</span>
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

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {toggleableColumns.length - hiddenCount} of{" "}
            {toggleableColumns.length} columns visible
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={hiddenCount === 0}
            onClick={() => showAllColumns(table)}
          >
            Show all
          </Button>
        </div>

        <ul className="divide-y rounded-md border">
          {columns.map((column) => {
            const locked = isColumnVisibilityLocked(column);
            const visible = locked || !hiddenSet.has(column.key);

            return (
              <li key={column.key}>
                <label
                  className={`flex items-start gap-3 px-3 py-2.5 text-sm ${
                    locked
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={visible}
                    disabled={locked}
                    onChange={(event) =>
                      setColumnHidden(table, column.key, !event.target.checked)
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
                    <span className="block truncate text-xs text-muted-foreground">
                      {column.key}
                      {locked ? " · always visible" : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
