import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMasterUsers } from "@/actions/master";
import { MasterUsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function MasterUsersPage() {
  const session = await getSession();
  if (!session || session.roleCode !== "SUPERADMIN") {
    redirect("/login");
  }

  const [users, stores, roles] = await Promise.all([
    getMasterUsers(),
    prisma.store.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { code: "asc" },
    }),
    prisma.role.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <MasterUsersClient
      initialUsers={users as any}
      stores={stores}
      roles={roles}
    />
  );
}
