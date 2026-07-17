import type { InitializationStatus } from "@/types/initialization";

type StatusCountsProps = {
  status: InitializationStatus;
};

export default function StatusCounts({ status }: StatusCountsProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-border bg-background p-4">
        <span className="block text-sm text-muted-foreground">
          Power BI workspaces
        </span>
        <strong className="mt-1 block text-2xl">{status.groupCount}</strong>
      </div>
      <div className="rounded-md border border-border bg-background p-4">
        <span className="block text-sm text-muted-foreground">
          Power BI datasets
        </span>
        <strong className="mt-1 block text-2xl">{status.datasetCount}</strong>
      </div>
    </div>
  );
}
