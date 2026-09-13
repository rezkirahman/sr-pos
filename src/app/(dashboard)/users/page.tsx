import { getSession, userHasPermission } from "@/lib/auth";
import { getUsers, getStoreRoles } from "@/actions/user";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!userHasPermission(session, "users", "view")) {
    redirect("/pos");
  }

  const [users, roles] = await Promise.all([
    getUsers(),
    getStoreRoles(),
  ]);

  return <UsersClient initialUsers={users} currentUserId={session.id} roles={roles} />;
}
