"use client";

import { Columns3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useAddTableColumn,
  useDeleteTableColumn,
} from "@/hooks/useTables";
import { getApiErrorMessage } from "@/lib/api/client";
import type {
  ColumnDef,
  ColumnType,
  DashboardTableId,
} from "@/lib/dashboard/types/tables";
import { toast } from "sonner";

type ManageColumnsDialogProps = {
  table: DashboardTableId;
  columns: ColumnDef[];
  addableTypes: Array<{ value: Exclude<ColumnType, "fk">; label: string }>;
};

export function ManageColumnsDialog({
  table,
  columns,
  addableTypes,
}: ManageColumnsDialogProps) {
  const addColumn = useAddTableColumn(table);
  const deleteColumn = useDeleteTableColumn(table);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Exclude<ColumnType, "fk">>("text");
  const [nullable, setNullable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<ColumnDef | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const types = useMemo(
    () =>
      addableTypes.length > 0
        ? addableTypes
        : ([
            { value: "text", label: "Text" },
            { value: "boolean", label: "Boolean" },
            { value: "number", label: "Number" },
            { value: "date", label: "Date" },
            { value: "datetime", label: "Date & time" },
            { value: "uuid", label: "UUID" },
          ] as const),
    [addableTypes],
  );

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await addColumn.mutateAsync({
        column: name.trim(),
        type,
        nullable,
      });
      setName("");
      setType("text");
      setNullable(true);
      toast.success("Column added");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add column."));
    }
  }

  async function handleDelete() {
    if (!columnToDelete) return;
    setDeleteError(null);
    try {
      await deleteColumn.mutateAsync(columnToDelete.key);
      setColumnToDelete(null);
      toast.success("Column deleted");
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Failed to delete column."));
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Columns3 />
            Columns
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage columns</DialogTitle>
            <DialogDescription>
              Columns are loaded live from Supabase. Add or remove columns on
              this table.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3 rounded-md border p-3" onSubmit={handleAdd}>
            <p className="text-sm font-medium">Add column</p>
            <div className="grid gap-2">
              <Label htmlFor="column-name">Name</Label>
              <Input
                id="column-name"
                placeholder="new_column"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase snake_case, starting with a letter.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="column-type">Type</Label>
              <Select
                id="column-type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as Exclude<ColumnType, "fk">)
                }
              >
                {types.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={nullable}
                onChange={(event) => setNullable(event.target.checked)}
              />
              Allow null values
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={addColumn.isPending || !name.trim()}>
              <Plus />
              {addColumn.isPending ? "Adding..." : "Add column"}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-sm font-medium">Existing columns</p>
            <ul className="divide-y rounded-md border">
              {columns.map((column) => (
                <li
                  key={column.key}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{column.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {column.key} · {column.type}
                      {column.primaryKey ? " · PK" : ""}
                      {column.protected ? " · protected" : ""}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={Boolean(column.protected || column.primaryKey)}
                    onClick={() => {
                      setDeleteError(null);
                      setColumnToDelete(column);
                    }}
                    aria-label={`Delete column ${column.key}`}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(columnToDelete)}
        title="Delete column"
        description={`This permanently drops column “${
          columnToDelete?.key ?? ""
        }” from the Supabase table and deletes its data.`}
        pending={deleteColumn.isPending}
        error={deleteError}
        confirmLabel="Delete column"
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setColumnToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
