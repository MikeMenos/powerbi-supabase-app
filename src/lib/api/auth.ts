import { apiClient, unwrapApiResponse } from "@/lib/api/client";
import type {
  AuthMeResponse,
  AuthMeSuccess,
  LoginApiResponse,
  LoginSuccess,
} from "@/types/auth";

export async function fetchAuthMe(): Promise<AuthMeSuccess> {
  const response = await apiClient.get<AuthMeResponse>("/api/auth/me", {
    headers: { "Cache-Control": "no-store" },
  });

  return unwrapApiResponse(response, "Failed to load session.") as AuthMeSuccess;
}

export async function loginRequest(credentials: {
  username: string;
  password: string;
}): Promise<LoginSuccess> {
  const response = await apiClient.post<LoginApiResponse>(
    "/api/auth/login",
    credentials,
  );

  return unwrapApiResponse(response, "Login failed.") as LoginSuccess;
}

export async function logoutRequest(): Promise<{ ok: true }> {
  const response = await apiClient.post<{ ok: true }>("/api/auth/logout");

  return unwrapApiResponse(response, "Logout failed.");
}
