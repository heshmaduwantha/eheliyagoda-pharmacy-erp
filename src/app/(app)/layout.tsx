import { AppShell } from "@/components/layout/app-shell";
import { UnderConstructionView } from "@/components/layout/UnderConstructionView";
import { requireAuth } from "@/modules/auth/permissions";
import { getAlertCounts } from "@/modules/dashboard/dashboard.service";

export default async function ApplicationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAuth();

  const isUnderConstruction = user.permissions.includes("system.under_construction") || user.permissions.includes("under_construction");

  if (isUnderConstruction) {
    return <UnderConstructionView user={user} />;
  }

  const alerts = await getAlertCounts();
  return <AppShell user={user} alerts={alerts}>{children}</AppShell>;
}
