import "server-only";

import {
  fetchAllPowerBiDatasets,
  fetchPowerBiGroups,
  getPowerBiToken,
  loginToAmsa,
} from "@/lib/powerBi";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type {
  InitializationResult,
  InitializationStatus,
  PowerBiSyncResult,
} from "@/lib/types/initialization";
import type { PowerBiDataset, PowerBiGroup } from "@/lib/types/powerBi";

let activeInitialization: Promise<InitializationResult> | null = null;
let activeSync: Promise<PowerBiSyncResult> | null = null;

const INSERT_CHUNK_SIZE = 100;

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

function mapGroupRow(group: PowerBiGroup) {
  return {
    id: group.id,
    name: group.name,
    type: group.type,
    is_read_only: group.isReadOnly,
    is_on_dedicated_capacity: group.isOnDedicatedCapacity,
    is_active: true,
  };
}

function mapDatasetRow(workspaceId: string, dataset: PowerBiDataset) {
  return {
    id: dataset.id,
    workspace_id: workspaceId,
    name: dataset.name,
    web_url: dataset.webUrl ?? null,
    add_rows_api_enabled: dataset.addRowsAPIEnabled ?? null,
    configured_by: dataset.configuredBy ?? null,
    is_refreshable: dataset.isRefreshable ?? null,
    is_effective_identity_required: dataset.isEffectiveIdentityRequired ?? null,
    is_effective_identity_roles_required:
      dataset.isEffectiveIdentityRolesRequired ?? null,
    is_on_prem_gateway_required: dataset.isOnPremGatewayRequired ?? null,
    target_storage_mode: dataset.targetStorageMode ?? null,
    powerbi_created_at: dataset.createdDate ?? null,
    is_active: true,
  };
}

async function loadExistingIds(table: "powerbi_groups" | "powerbi_datasets") {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(table).select("id");
  if (error) {
    throw new Error(`Failed to read existing ${table}: ${error.message}`);
  }
  return new Set((data ?? []).map((row) => String(row.id)));
}

async function insertChunks(
  table: "powerbi_groups" | "powerbi_datasets",
  rows: Record<string, unknown>[],
) {
  if (rows.length === 0) return;

  const supabase = createSupabaseAdminClient();
  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(index, index + INSERT_CHUNK_SIZE);
    const { error } = await supabase.from(table).insert(chunk as never);
    if (error) {
      throw new Error(`Failed to insert into ${table}: ${error.message}`);
    }
  }
}

async function runPowerBiSync(amsaAccessToken: string): Promise<PowerBiSyncResult> {
  const powerBiAccessToken = await getPowerBiToken(amsaAccessToken);
  const groups = await fetchPowerBiGroups(powerBiAccessToken);

  if (!groups.length) {
    throw new Error("Power BI returned no groups.");
  }

  const datasets = await fetchAllPowerBiDatasets(powerBiAccessToken, groups);
  if (datasets.length === 0) {
    throw new Error("Power BI returned no datasets for the available groups.");
  }

  const [existingGroupIds, existingDatasetIds] = await Promise.all([
    loadExistingIds("powerbi_groups"),
    loadExistingIds("powerbi_datasets"),
  ]);

  const newGroups = groups
    .filter((group) => !existingGroupIds.has(group.id))
    .map(mapGroupRow);

  await insertChunks("powerbi_groups", newGroups);

  const newDatasets = datasets
    .filter(({ dataset }) => !existingDatasetIds.has(dataset.id))
    .map(({ workspaceId, dataset }) => mapDatasetRow(workspaceId, dataset));

  await insertChunks("powerbi_datasets", newDatasets);

  const status = await getInitializationStatus();
  return {
    ...status,
    groupsAdded: newGroups.length,
    datasetsAdded: newDatasets.length,
  };
}

export function syncPowerBiCatalog(
  amsaAccessToken: string,
): Promise<PowerBiSyncResult> {
  if (activeSync) return activeSync;

  activeSync = runPowerBiSync(amsaAccessToken).finally(() => {
    activeSync = null;
  });

  return activeSync;
}

async function runInitialization(
  amsaAccessToken: string,
): Promise<InitializationResult> {
  const sync = await syncPowerBiCatalog(amsaAccessToken);
  return {
    initialized: sync.initialized,
    groupCount: sync.groupCount,
    datasetCount: sync.datasetCount,
    skipped: sync.groupsAdded === 0 && sync.datasetsAdded === 0,
  };
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
