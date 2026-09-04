import type { Metadata } from "next";
import { UnderConstructionView } from "@/components/layout/UnderConstructionView";
import { requireAuth } from "@/modules/auth/permissions";

export const metadata: Metadata = { title: "Under Construction" };

export default async function StandaloneUnderConstructionPage() {
  const user = await requireAuth();
  return <UnderConstructionView user={user} />;
}
