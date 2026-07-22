"use client";

import { ArrowLeft, Layers3 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { TableBrowser } from "@/components/dashboard/TableBrowser";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  TableRow,
} from "@/components/ui/table";
import { useReportQueryTriplets } from "@/hooks/useTables";
import type { ReportQueryTripletSummary } from "@/lib/reports/queryGrouping";
import type { ReportQueryType } from "@/lib/reports/types/reportQueries";

const PAGE_CODE_PARAM = "page_code";
const REPORT_BASE_PARAM = "report_base";
const TRIPLET_TYPES: ReportQueryType[] = ["VCYTCY", "VLY", "VTREND"];

function TripletTypeChips({
  presentTypes,
}: {
  presentTypes: ReportQueryType[];
}) {
  const present = new Set(presentTypes);
  return (
    <>
      {TRIPLET_TYPES.map((type) => (
        <Badge
          key={type}
          variant={present.has(type) ? "default" : "outline"}
          className={
            present.has(type)
              ? "mr-1.5 last:mr-0"
              : "mr-1.5 text-muted-foreground last:mr-0"
          }
        >
          {type}
        </Badge>
      ))}
    </>
  );
}

function TripletPicker({
  onSelect,
}: {
  onSelect: (triplet: ReportQueryTripletSummary) => void;
}) {
  const [query, setQuery] = useState("");
  const tripletsQuery = useReportQueryTriplets();

  const filtered = useMemo(() => {
    const triplets = tripletsQuery.data ?? [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return triplets;
    return triplets.filter(
      (triplet) =>
        triplet.reportBase.toLowerCase().includes(normalized) ||
        triplet.pageCode.toLowerCase().includes(normalized) ||
        (triplet.reportPage?.toLowerCase().includes(normalized) ?? false),
    );
  }, [query, tripletsQuery.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Queries</CardTitle>
        <CardDescription>
          Choose a VCYTCY / VLY / VTREND triplet to view and edit its queries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by report base, page code, or report page…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search triplets"
        />

        {tripletsQuery.isLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </>
        ) : tripletsQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {tripletsQuery.error instanceof Error
                ? tripletsQuery.error.message
                : "Failed to load triplets."}
            </AlertDescription>
          </Alert>
        ) : filtered.length === 0 ? (
          <Alert>
            <AlertDescription>
              {query.trim()
                ? `No triplets match “${query.trim()}”.`
                : "No report query triplets found."}
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableBody>
              {filtered.map((triplet) => (
                <TableRow
                  key={triplet.key}
                  className="cursor-pointer"
                  onClick={() => onSelect(triplet)}
                >
                  <TableCell className="w-9">
                    <Layers3 className="size-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {triplet.reportBase}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {triplet.pageCode
                      ? `Page code: ${triplet.pageCode}`
                      : "No page code"}
                    {triplet.reportPage ? ` · ${triplet.reportPage}` : ""}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <TripletTypeChips presentTypes={triplet.presentTypes} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportQueriesBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageCode = searchParams.has(PAGE_CODE_PARAM)
    ? (searchParams.get(PAGE_CODE_PARAM) ?? "")
    : null;
  const reportBase = searchParams.get(REPORT_BASE_PARAM)?.trim() || null;

  const tripletsQuery = useReportQueryTriplets(
    Boolean(reportBase && pageCode !== null),
  );

  const selectedTriplet = useMemo(() => {
    if (reportBase == null || pageCode === null) return null;
    const key = `${pageCode}::${reportBase}`;
    return (
      tripletsQuery.data?.find((triplet) => triplet.key === key) ?? {
        key,
        pageCode,
        reportBase,
        reportPage: null,
        presentTypes: [] as ReportQueryType[],
        missingTypes: TRIPLET_TYPES,
        complete: false,
        queryCount: 0,
      }
    );
  }, [pageCode, reportBase, tripletsQuery.data]);

  function selectTriplet(triplet: ReportQueryTripletSummary) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(PAGE_CODE_PARAM, triplet.pageCode);
    params.set(REPORT_BASE_PARAM, triplet.reportBase);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearTriplet() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(PAGE_CODE_PARAM);
    params.delete(REPORT_BASE_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  if (reportBase == null || pageCode === null || !selectedTriplet) {
    return <TripletPicker onSelect={selectTriplet} />;
  }

  return (
    <TableBrowser
      table="report_queries"
      filters={{ page_code: selectedTriplet.pageCode }}
      reportCodeBase={selectedTriplet.reportBase}
      defaultCreateValues={{
        page_code: selectedTriplet.pageCode || null,
        report_page: selectedTriplet.reportPage ?? "",
        report_code: `${selectedTriplet.reportBase}-`,
      }}
      forceHiddenColumns={["id"]}
      title="Report Queries"
      description={`Triplet ${selectedTriplet.reportBase}${
        selectedTriplet.pageCode ? ` · page ${selectedTriplet.pageCode}` : ""
      }.`}
      toolbarStart={
        <Card>
          <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <CardHeader className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-3 space-y-0 p-0">
              <CardTitle className="truncate text-sm">
                {selectedTriplet.reportBase}
              </CardTitle>
              <CardDescription className="truncate">
                {selectedTriplet.pageCode
                  ? `Page code: ${selectedTriplet.pageCode}`
                  : "No page code"}
                {selectedTriplet.reportPage
                  ? ` · ${selectedTriplet.reportPage}`
                  : ""}
              </CardDescription>
              <CardDescription className="flex flex-nowrap items-center gap-1.5">
                <TripletTypeChips
                  presentTypes={selectedTriplet.presentTypes}
                />
              </CardDescription>
            </CardHeader>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearTriplet}
            >
              <ArrowLeft />
              Change triplet
            </Button>
          </CardContent>
        </Card>
      }
    />
  );
}
