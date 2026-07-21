"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { tableKeys } from "@/hooks/queryKeys";
import { fetchFkOptions } from "@/lib/api/tables";
import { getFormColumnsFromDefs } from "@/lib/dashboard/tableCatalog";
import type {
  ColumnDef,
  DashboardTableId,
  FkOption,
  TableRow,
} from "@/lib/dashboard/types/tables";

type RowFormDialogProps = {
  table: DashboardTableId;
  columns: ColumnDef[];
  open: boolean;
  mode: "create" | "edit";
  row: TableRow | null;
  pending?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
};

function defaultValue(column: ColumnDef, row: TableRow | null) {
  if (row && row[column.key] != null) {
    const value = row[column.key];
    if (column.type === "boolean") return Boolean(value);
    if (column.type === "datetime" && typeof value === "string") {
      return value.slice(0, 16);
    }
    return value;
  }

  if (column.type === "boolean") return true;
  return "";
}

function buildInitialValues(columns: ColumnDef[], row: TableRow | null) {
  const next: Record<string, unknown> = {};
  for (const column of columns) {
    next[column.key] = defaultValue(column, row);
  }
  return next;
}

function fkCacheKey(column: ColumnDef) {
  return [
    column.fkTable ?? "none",
    column.fkValueKey ?? "id",
    column.fkLabelKey ?? "id",
  ].join(":");
}

function FieldControl({
  column,
  value,
  onChange,
  fkOptions,
  fkLoading,
}: {
  column: ColumnDef;
  value: unknown;
  onChange: (value: unknown) => void;
  fkOptions?: FkOption[];
  fkLoading?: boolean;
}) {
  if (column.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        {column.label}
      </label>
    );
  }

  if (column.type === "fk") {
    return (
      <Select
        value={String(value ?? "")}
        disabled={fkLoading}
        onChange={(event) => onChange(event.target.value)}
        required={column.required}
      >
        <option value="">Select {column.label.toLowerCase()}…</option>
        {(fkOptions ?? []).map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }

  if (column.type === "longtext") {
    return (
      <textarea
        className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
        required={column.required}
      />
    );
  }

  const inputType =
    column.type === "number"
      ? "number"
      : column.type === "date"
        ? "date"
        : column.type === "datetime"
          ? "datetime-local"
          : "text";

  return (
    <Input
      type={inputType}
      value={value == null ? "" : String(value)}
      onChange={(event) => onChange(event.target.value)}
      required={column.required}
    />
  );
}

function RowFormFields({
  mode,
  row,
  columns: allColumns,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  row: TableRow | null;
  columns: ColumnDef[];
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
}) {
  const columns = useMemo(
    () => getFormColumnsFromDefs(allColumns, mode),
    [allColumns, mode],
  );
  const fkColumns = useMemo(
    () => columns.filter((column) => column.type === "fk" && column.fkTable),
    [columns],
  );

  const fkQueries = useQueries({
    queries: fkColumns.map((column) => {
      const valueKey = column.fkValueKey ?? "id";
      const labelKey = column.fkLabelKey ?? "id";
      return {
        queryKey: tableKeys.fkOptions(column.fkTable!, valueKey, labelKey),
        queryFn: () =>
          fetchFkOptions(column.fkTable!, {
            valueKey: column.fkValueKey,
            labelKey: column.fkLabelKey,
          }),
        staleTime: 60_000,
      };
    }),
  });

  const fkOptionsByColumn = useMemo(() => {
    const map = new Map<
      string,
      { options?: FkOption[]; isLoading: boolean }
    >();
    fkColumns.forEach((column, index) => {
      const query = fkQueries[index];
      map.set(fkCacheKey(column), {
        options: query?.data,
        isLoading: Boolean(query?.isLoading),
      });
    });
    return map;
  }, [fkColumns, fkQueries]);

  const [values, setValues] = useState(() => buildInitialValues(columns, row));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {columns.map((column) => {
        const fkState =
          column.type === "fk"
            ? fkOptionsByColumn.get(fkCacheKey(column))
            : undefined;

        return (
          <div key={column.key} className="grid gap-2">
            {column.type === "boolean" ? null : (
              <Label htmlFor={column.key}>
                {column.label}
                {column.required ? " *" : ""}
              </Label>
            )}
            <FieldControl
              column={column}
              value={values[column.key]}
              fkOptions={fkState?.options}
              fkLoading={fkState?.isLoading}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  [column.key]: value,
                }))
              }
            />
          </div>
        );
      })}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving..."
            : mode === "create"
              ? "Create"
              : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RowFormDialog({
  columns,
  open,
  mode,
  row,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: RowFormDialogProps) {
  const formKey = `${mode}-${String(row?.id ?? "new")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add row" : "Edit row"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new record in this table."
              : "Update the selected record."}
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <RowFormFields
            key={formKey}
            columns={columns}
            mode={mode}
            row={row}
            pending={pending}
            error={error}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
