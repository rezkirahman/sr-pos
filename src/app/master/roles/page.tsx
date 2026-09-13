import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRolesWithPermissions } from "@/actions/master";
import { RolesClient } from "./roles-client";

export const dynamic = "force-dynamic";

export default async function MasterRolesPage() {
  const session = await getSession();
  if (!session || session.roleCode !== "SUPERADMIN") {
    redirect("/login");
  }

  const roles = await getRolesWithPermissions();

  return <RolesClient initialRoles={roles as any} />;
}

