import { getSession } from "@/lib/auth";
import { getUsers } from "@/actions/user";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== Role.OWNER) {
    redirect("/pos");
  }

  const users = await getUsers();

  return <UsersClient initialUsers={users} currentUserId={session.id} />;
}
