import "server-only";

import {
  fetchPowerBiDatasets,
  fetchPowerBiGroups,
  getPowerBiToken,
  loginToAmsa,
} from "@/lib/powerBi";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type {
  InitializationResult,
  InitializationStatus,
} from "@/lib/types/initialization";

let activeInitialization: Promise<InitializationResult> | null = null;

export async function getInitializationStatus(): Promise<InitializationStatus> {
  const supabase = createSupabaseAdminClient();
  const [groupsResult, datasetsResult] = await Promise.all([
    supabase
      .from("powerbi_groups")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("powerbi_datasets")
      .select("id", { count: "exact", head: true }),
  ]);

  if (groupsResult.error) {
    throw new Error(
      `Failed to read powerbi_groups: ${groupsResult.error.message}`,
    );
  }
  if (datasetsResult.error) {
    throw new Error(
      `Failed to read powerbi_datasets: ${datasetsResult.error.message}`,
    );
  }

  const groupCount = groupsResult.count ?? 0;
  const datasetCount = datasetsResult.count ?? 0;

  return {
    initialized: groupCount > 0 && datasetCount > 0,
    groupCount,
    datasetCount,
  };
}

async function runInitialization(
  amsaAccessToken: string,
): Promise<InitializationResult> {
  const powerBiAccessToken = await getPowerBiToken(amsaAccessToken);
  const groups = await fetchPowerBiGroups(powerBiAccessToken);

  if (!groups.length) {
    throw new Error("Power BI returned no groups.");
  }

  let datasetCount = 0;

  for (const group of groups) {
    const datasets = await fetchPowerBiDatasets(powerBiAccessToken, group.id);
    datasetCount += datasets.length;
  }

  if (datasetCount === 0) {
    throw new Error(
      "Power BI returnPower BI workspacesfor the available groups.",
    );
  }

  const status = await getInitializationStatus();
  return { ...status, skipped: true };
}

export function initializePowerBiTables(
  username: string,
  password: string,
): Promise<InitializationResult> {
  return loginToAmsa(username, password).then(
    initializePowerBiTablesForSession,
  );
}

export function initializePowerBiTablesForSession(
  amsaAccessToken: string,
): Promise<InitializationResult> {
  if (activeInitialization) return activeInitialization;

  activeInitialization = runInitialization(amsaAccessToken).finally(() => {
    activeInitialization = null;
  });

  return activeInitialization;
}
