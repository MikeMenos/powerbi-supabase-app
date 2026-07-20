import "server-only";

import axios from "axios";

import type { LoginResponse } from "@/lib/types/auth";
import type {
  AmsaPowerBiTokenResponse,
  PowerBiDataset,
  PowerBiGroup,
} from "@/lib/types/powerBi";

function getAmsaBaseUrl() {
  const baseUrl = process.env.AMSA_API_BASE_URL?.trim();
  if (!baseUrl) throw new Error("Missing AMSA_API_BASE_URL.");
  return baseUrl.replace(/\/+$/, "");
}

function getAxiosMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string }; message?: string; detailedMessage?: string }
      | string
      | undefined;

    if (typeof data === "string" && data.trim()) return data;
    if (typeof data === "object" && data !== null) {
      if (data.error?.message) return data.error.message;
      if (data.detailedMessage) return data.detailedMessage;
      if (data.message) return data.message;
    }
  }

  return fallback;
}

export async function authenticateWithAmsa(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(
    `${getAmsaBaseUrl()}/api/login`,
    { username, password },
    { validateStatus: () => true },
  );
  const data = response.data;
  const statusCode = Number(data.statusCode);

  if (
    response.status < 200 ||
    response.status >= 300 ||
    (Number.isFinite(statusCode) && statusCode !== 200) ||
    !data.accessToken
  ) {
    throw new Error(data.message || "AMSA login failed.");
  }

  return data;
}

export async function loginToAmsa(
  username: string,
  password: string,
): Promise<string> {
  const data = await authenticateWithAmsa(username, password);
  if (!data.accessToken) {
    throw new Error(data.message || "AMSA login failed.");
  }

  return data.accessToken;
}

export async function getPowerBiToken(amsaAccessToken: string) {
  const response = await axios.get<AmsaPowerBiTokenResponse | string>(
    `${getAmsaBaseUrl()}/api/fetch-pbi-token`,
    {
      headers: {
        Accept: "text/plain",
        Authorization: `Bearer ${amsaAccessToken}`,
      },
      validateStatus: () => true,
    },
  );
  const data =
    typeof response.data === "string"
      ? ({ token: response.data } satisfies AmsaPowerBiTokenResponse)
      : response.data;
  const statusCode = Number(data.statusCode);
  const token = data.token?.trim() || data.token_data?.trim();

  if (
    response.status < 200 ||
    response.status >= 300 ||
    (Number.isFinite(statusCode) &&
      statusCode !== 0 &&
      statusCode !== 200) ||
    !token
  ) {
    throw new Error(
      data.detailedMessage ||
        data.message ||
        "The AMSA token service did not return a Power BI token.",
    );
  }

  return token;
}

async function fetchPowerBiJson<T>(accessToken: string, path: string) {
  try {
    const response = await axios.get<T>(
      `https://api.powerbi.com/v1.0/myorg/${path}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(getAxiosMessage(error, "Power BI request failed."));
  }
}

export async function fetchPowerBiGroups(accessToken: string) {
  const data = await fetchPowerBiJson<{ value?: PowerBiGroup[] }>(
    accessToken,
    "groups",
  );
  return (data.value ?? []).filter((group) => group.id && group.name);
}

export async function fetchPowerBiDatasets(
  accessToken: string,
  groupId: string,
) {
  const data = await fetchPowerBiJson<{ value?: PowerBiDataset[] }>(
    accessToken,
    `groups/${encodeURIComponent(groupId)}/datasets`,
  );
  return (data.value ?? []).filter((dataset) => dataset.id && dataset.name);
}

export async function fetchAllPowerBiDatasets(
  accessToken: string,
  groups: PowerBiGroup[],
) {
  const results: Array<{ workspaceId: string; dataset: PowerBiDataset }> = [];
  const concurrency = 4;

  for (let index = 0; index < groups.length; index += concurrency) {
    const batch = groups.slice(index, index + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (group) => ({
        workspaceId: group.id,
        datasets: await fetchPowerBiDatasets(accessToken, group.id),
      })),
    );

    for (const result of batchResults) {
      for (const dataset of result.datasets) {
        results.push({ workspaceId: result.workspaceId, dataset });
      }
    }
  }

  return results;
}
