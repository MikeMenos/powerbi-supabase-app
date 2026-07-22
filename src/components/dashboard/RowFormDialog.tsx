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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
  defaultValues?: Record<string, unknown>;
  omitFields?: string[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
};

function defaultValue(
  column: ColumnDef,
  row: TableRow | null,
  defaults?: Record<string, unknown>,
) {
  if (row && row[column.key] != null) {
    const value = row[column.key];
    if (column.type === "boolean") return Boolean(value);
    if (column.type === "datetime" && typeof value === "string") {
      return value.slice(0, 16);
    }
    return value;
  }

  if (defaults && defaults[column.key] != null) {
    return defaults[column.key];
  }

  if (column.type === "boolean") return true;
  return "";
}

function buildInitialValues(
  columns: ColumnDef[],
  row: TableRow | null,
  defaults?: Record<string, unknown>,
) {
  const next: Record<string, unknown> = {};
  for (const column of columns) {
    next[column.key] = defaultValue(column, row, defaults);
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
      <Label className="flex cursor-pointer items-center gap-2 font-normal">
        <Checkbox
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        {column.label}
      </Label>
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
      <Textarea
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
  defaultValues,
  omitFields,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  row: TableRow | null;
  columns: ColumnDef[];
  pending?: boolean;
  error?: string | null;
  defaultValues?: Record<string, unknown>;
  omitFields?: string[];
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
}) {
  const omitted = useMemo(() => new Set(omitFields ?? []), [omitFields]);
  const columns = useMemo(
    () =>
      getFormColumnsFromDefs(allColumns, mode).filter(
        (column) => !omitted.has(column.key),
      ),
    [allColumns, mode, omitted],
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

  const [values, setValues] = useState(() =>
    buildInitialValues(columns, row, defaultValues),
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const omittedValues: Record<string, unknown> = {};
    for (const key of omitted) {
      if (defaultValues && defaultValues[key] != null) {
        omittedValues[key] = defaultValues[key];
      } else if (row && row[key] != null) {
        omittedValues[key] = row[key];
      }
    }
    await onSubmit({ ...omittedValues, ...values });
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

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
  defaultValues,
  omitFields,
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
            defaultValues={defaultValues}
            omitFields={omitFields}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
