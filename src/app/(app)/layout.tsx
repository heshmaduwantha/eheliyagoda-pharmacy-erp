import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/modules/auth/permissions";
import { getAlertCounts } from "@/modules/dashboard/dashboard.service";

export default async function ApplicationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAuth();
  const alerts = await getAlertCounts();
  return <AppShell user={user} alerts={alerts}>{children}</AppShell>;
}
