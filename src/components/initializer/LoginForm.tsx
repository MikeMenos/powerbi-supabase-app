"use client";

import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api/client";

type LoginFormProps = {
  onError: (message: string | null) => void;
  onCompleted: (completedNow: boolean) => void;
};

export default function LoginForm({ onCompleted, onError }: LoginFormProps) {
  const login = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (login.isPending) return;

    onError(null);

    try {
      const result = await login.mutateAsync({
        username: username.trim(),
        password,
      });
      onCompleted(!result.initialization.skipped);
      setPassword("");
    } catch (error) {
      onError(getApiErrorMessage(error, "Login failed."));
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="username">AMSA username</Label>
        <Input
          id="username"
          autoComplete="username"
          value={username}
          disabled={login.isPending}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">AMSA password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={login.isPending}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <Button
        type="submit"
        disabled={
          login.isPending || username.trim().length < 2 || password.length < 2
        }
      >
        <LogIn aria-hidden />
        {login.isPending ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
