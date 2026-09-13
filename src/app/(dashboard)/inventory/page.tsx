import { getSession, userHasPermission } from "@/lib/auth";
import { getProducts, getCategories } from "@/actions/product";
import { redirect } from "next/navigation";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const canManage = userHasPermission(session, "inventory", "create") || userHasPermission(session, "inventory", "update");
  const initialProducts = await getProducts();
  const categories = await getCategories();

  return (
    <InventoryClient
      initialProducts={initialProducts}
      categories={categories}
      isOwner={canManage}
    />
  );
}
