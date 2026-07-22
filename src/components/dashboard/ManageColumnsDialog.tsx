"use client";

import { Columns3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add column</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleAdd}>
                <Label htmlFor="column-name">Name</Label>
                <Input
                  id="column-name"
                  placeholder="new_column"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <CardDescription>
                  Lowercase snake_case, starting with a letter.
                </CardDescription>
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
                <Label className="flex cursor-pointer items-center gap-2 font-normal">
                  <Checkbox
                    checked={nullable}
                    onChange={(event) => setNullable(event.target.checked)}
                  />
                  Allow null values
                </Label>
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <Button
                  type="submit"
                  disabled={addColumn.isPending || !name.trim()}
                >
                  <Plus />
                  {addColumn.isPending ? "Adding..." : "Add column"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Existing columns</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {columns.map((column) => (
                    <TableRow key={column.key}>
                      <TableCell className="min-w-0">
                        <CardTitle className="truncate text-sm font-medium">
                          {column.label}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {column.key} · {column.type}
                          {column.primaryKey ? " · PK" : ""}
                          {column.protected ? " · protected" : ""}
                        </CardDescription>
                      </TableCell>
                      <TableCell className="w-[1%] text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={Boolean(
                            column.protected || column.primaryKey,
                          )}
                          onClick={() => {
                            setDeleteError(null);
                            setColumnToDelete(column);
                          }}
                          aria-label={`Delete column ${column.key}`}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
