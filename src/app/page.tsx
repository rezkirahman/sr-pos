import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.roleCode === "SUPERADMIN") {
    redirect("/master");
  }

  if (session.permissions?.some((p) => p.module === "dashboard" && p.canView)) {
    redirect("/dashboard");
  }

  redirect("/pos");
}
