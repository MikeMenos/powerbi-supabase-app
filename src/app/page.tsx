import { HomeSummary } from "@/components/dashboard/HomeSummary";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function HomePage() {
  return (
    <DashboardShell
      title="Home"
      description="Summary of Supabase tables connected to this app."
    >
      <HomeSummary />
    </DashboardShell>
  );
}
