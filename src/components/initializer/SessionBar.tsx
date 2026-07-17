"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api/client";

type SessionBarProps = {
  username: string;
  onError: (message: string | null) => void;
};

export default function SessionBar({ username, onError }: SessionBarProps) {
  const logout = useLogout();

  async function handleLogout() {
    onError(null);

    try {
      await logout.mutateAsync();
    } catch (error) {
      onError(getApiErrorMessage(error, "Logout failed."));
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <span className="block text-sm text-muted-foreground">Signed in</span>
        <strong className="mt-1 block text-sm font-semibold">{username}</strong>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={logout.isPending}
        onClick={handleLogout}
      >
        <LogOut aria-hidden />
        {logout.isPending ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}
