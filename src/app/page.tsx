import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === Role.OWNER) {
    redirect("/dashboard");
  }

  redirect("/pos");
}
