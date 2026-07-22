"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { TableBrowser } from "@/components/dashboard/TableBrowser";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  TableRow,
} from "@/components/ui/table";
import { useFkOptions } from "@/hooks/useTables";

/** URL/query param stores the workbooks.id UUID (FK target). */
const WORKBOOK_ID_PARAM = "workbook_id";

const WORKBOOK_OPTIONS = {
  valueKey: "id",
  labelKey: "workbook_name",
  descriptionKey: "workbook_id",
} as const;

function WorkbookPicker({
  onSelect,
}: {
  onSelect: (workbookRowId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const workbooksQuery = useFkOptions("workbooks", WORKBOOK_OPTIONS);

  const filtered = useMemo(() => {
    const options = workbooksQuery.data ?? [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.id.toLowerCase().includes(normalized) ||
        (option.description?.toLowerCase().includes(normalized) ?? false),
    );
  }, [query, workbooksQuery.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workbook Pages</CardTitle>
        <CardDescription>
          Choose a workbook to view and manage its pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search workbooks by name or Workbook ID…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search workbooks"
        />

        {workbooksQuery.isLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </>
        ) : workbooksQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {workbooksQuery.error instanceof Error
                ? workbooksQuery.error.message
                : "Failed to load workbooks."}
            </AlertDescription>
          </Alert>
        ) : filtered.length === 0 ? (
          <Alert>
            <AlertDescription>
              {query.trim()
                ? `No workbooks match “${query.trim()}”.`
                : "No workbooks found. Create one under Workbooks first."}
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="overflow-hidden py-0 shadow-none">
            <Table>
              <TableBody>
                {filtered.map((workbook) => (
                  <TableRow
                    key={workbook.id}
                    className="cursor-pointer"
                    onClick={() => onSelect(workbook.id)}
                  >
                    <TableCell className="px-4 py-3">
                      <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-0">
                        <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <CardHeader className="min-w-0 space-y-0.5 p-0">
                          <CardTitle className="text-sm font-medium leading-none">
                            {workbook.label}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {workbook.description
                              ? `Workbook ID: ${workbook.description}`
                              : workbook.id}
                          </CardDescription>
                        </CardHeader>
                      </CardHeader>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkbookPagesBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workbookRowId = searchParams.get(WORKBOOK_ID_PARAM)?.trim() || null;

  const workbooksQuery = useFkOptions("workbooks", {
    ...WORKBOOK_OPTIONS,
    enabled: Boolean(workbookRowId),
  });

  const selectedWorkbook = useMemo(() => {
    if (!workbookRowId) return null;
    return (
      workbooksQuery.data?.find((option) => option.id === workbookRowId) ??
      null
    );
  }, [workbookRowId, workbooksQuery.data]);

  function selectWorkbook(nextId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(WORKBOOK_ID_PARAM, nextId);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearWorkbook() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(WORKBOOK_ID_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  if (!workbookRowId) {
    return <WorkbookPicker onSelect={selectWorkbook} />;
  }

  const workbookLabel = selectedWorkbook?.label ?? workbookRowId;
  const workbookBusinessId = selectedWorkbook?.description;

  return (
    <TableBrowser
      table="workbook_pages"
      filters={{ workbook_id: workbookRowId }}
      defaultCreateValues={{ workbook_id: workbookRowId }}
      forceHiddenColumns={["id", "workbook_id"]}
      omitFormFields={["workbook_id"]}
      title="Workbook Pages"
      description={`Pages for ${workbookLabel}.`}
      toolbarStart={
        <Card>
          <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <CardHeader className="min-w-0 space-y-1 p-0">
              <CardTitle className="truncate text-sm">{workbookLabel}</CardTitle>
              <CardDescription className="truncate">
                {workbookBusinessId
                  ? `Workbook ID: ${workbookBusinessId}`
                  : workbookRowId}
              </CardDescription>
            </CardHeader>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearWorkbook}
            >
              <ArrowLeft />
              Change workbook
            </Button>
          </CardContent>
        </Card>
      }
    />
  );
}
