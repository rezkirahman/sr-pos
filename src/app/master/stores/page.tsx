import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMasterStores } from "@/actions/master";
import { MasterStoresClient } from "./stores-client";

export const dynamic = "force-dynamic";

export default async function MasterStoresPage() {
  const session = await getSession();
  if (!session || session.roleCode !== "SUPERADMIN") {
    redirect("/login");
  }

  const stores = await getMasterStores();

  return <MasterStoresClient initialStores={stores as any} />;
}

