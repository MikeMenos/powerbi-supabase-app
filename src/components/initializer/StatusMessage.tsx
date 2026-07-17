import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import type { InitializationStatus } from "@/types/initialization";

type StatusMessageProps = {
  authenticated: boolean;
  completedNow: boolean;
  error: string | null;
  status: InitializationStatus;
};

export default function StatusMessage({
  authenticated,
  completedNow,
  error,
  status,
}: StatusMessageProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Request failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!authenticated) return null;

  return (
    <Alert variant="success">
      <AlertTitle>
        {completedNow
          ? "Power BI endpoints checked"
          : status.initialized
            ? "Supabase already initialized"
            : "Signed in"}
      </AlertTitle>
      <AlertDescription>
        {status.initialized
          ? "The connected Supabase tables already contain workspace and dataset rows."
          : "The Power BI endpoints were checked, but no Supabase upload is configured."}
      </AlertDescription>
    </Alert>
  );
}
