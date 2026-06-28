import { apiGet } from "@/lib/api/client";
import { getServerAccess } from "@/lib/auth";
import Restricted from "@/components/Restricted";
import HelpView from "@/components/aide/HelpView";
import type { HelpPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AidePage() {
  if ((await getServerAccess("aide")) === "none") return <Restricted />;
  const data = await apiGet<HelpPage>("/help");
  const help = data || { id: 1, blocks: [] };
  return <HelpView help={help} />;
}
