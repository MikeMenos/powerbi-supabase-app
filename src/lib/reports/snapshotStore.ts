import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  describeLargestSnapshotRatio,
  sanitizeLegacySnapshotRatios,
} from "@/lib/reports/snapshotDiagnostics";
import type {
  AvailableSnapshot,
  SnapshotLookup,
  SnapshotReadResult,
  SnapshotRow,
} from "@/lib/reports/types/snapshots";

export async function readLatestSnapshot(
  input: SnapshotLookup,
): Promise<SnapshotReadResult> {
  const supabase = createSupabaseAdminClient();
  const { data: snapshots, error: snapshotError } = await supabase
    .from("v_available_snapshots")
    .select("*")
    .eq("area", input.area)
    .eq("page_code", input.pageCode)
    .eq("year", input.year)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  if (snapshotError) {
    throw new Error(
      `Failed to load available snapshots: ${snapshotError.message}`,
    );
  }

  const snapshot = ((snapshots ?? [])[0] ?? null) as AvailableSnapshot | null;
  if (!snapshot) return { rows: [], snapshot };

  const { data: rows, error: rowsError } = await supabase
    .from("sales_snapshots")
    .select("*")
    .eq("is_active", true)
    .eq("area", input.area)
    .eq("page_code", input.pageCode)
    .eq("year", input.year)
    .eq("snapshot_date", snapshot.snapshot_date)
    .order("report_code")
    .order("group2")
    .order("group1")
    .order("seller_name");

  if (rowsError) {
    throw new Error(`Failed to load snapshots: ${rowsError.message}`);
  }

  return { rows: (rows ?? []) as SnapshotRow[], snapshot };
}

export async function replaceTodaySnapshot(input: {
  area: string;
  pageCode: string;
  snapshotDate: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("sales_snapshots")
    .delete()
    .eq("snapshot_date", input.snapshotDate)
    .eq("area", input.area)
    .eq("page_code", input.pageCode);

  if (error) {
    throw new Error(`Failed to replace today's snapshot: ${error.message}`);
  }
}

export async function insertSnapshotRows(rows: Record<string, unknown>[]) {
  const supabase = createSupabaseAdminClient();
  let inserted = 0;

  for (let index = 0; index < rows.length; index += 500) {
    const chunk = rows.slice(index, index + 500);
    let { error } = await supabase.from("sales_snapshots").insert(chunk);
    if (error?.code === "22003") {
      const sanitized = sanitizeLegacySnapshotRatios(chunk);
      if (sanitized.changedCount > 0) {
        const retry = await supabase
          .from("sales_snapshots")
          .insert(sanitized.rows);
        error = retry.error;
      }
    }

    if (error) {
      const databaseDetail = [error.message, error.details, error.hint]
        .filter(Boolean)
        .join(". ");
      const ratioDetail = describeLargestSnapshotRatio(chunk);
      throw new Error(
        [
          `Failed to insert snapshot rows (${error.code}): ${databaseDetail}`,
          ratioDetail ? `Largest ratio in this batch: ${ratioDetail}` : null,
        ]
          .filter(Boolean)
          .join(". "),
      );
    }
    inserted += chunk.length;
  }

  return inserted;
}
