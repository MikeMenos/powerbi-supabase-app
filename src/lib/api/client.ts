import axios, { type AxiosResponse } from "axios";

export const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export function unwrapApiResponse<T>(
  response: AxiosResponse<T>,
  fallbackMessage: string,
): T {
  const data = response.data as T & { ok?: boolean; message?: string };

  if (data?.ok === false) {
    throw new Error(data.message || fallbackMessage);
  }

  return response.data;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
