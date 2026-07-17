"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchAuthMe, loginRequest, logoutRequest } from "@/lib/api/auth";
import { fetchInitializationStatus } from "@/lib/api/status";
import { authKeys, initializationKeys } from "@/hooks/queryKeys";

export function useAuthMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchAuthMe,
    staleTime: 30_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), {
        ok: true,
        authenticated: true,
        userInfos: data.userInfos ?? null,
        user: { username: data.userInfos?.username ?? "user" },
      });
      queryClient.setQueryData(
        initializationKeys.status(),
        data.initialization,
      );
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      queryClient.setQueryData(authKeys.me(), {
        ok: true,
        authenticated: false,
      });
    },
  });
}

export function useInitializationStatus() {
  return useQuery({
    queryKey: initializationKeys.status(),
    queryFn: fetchInitializationStatus,
    staleTime: 30_000,
  });
}
