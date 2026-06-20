import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/modules/auth/permissions";

export default async function ApplicationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAuth();
  return <AppShell user={user}>{children}</AppShell>;
}
