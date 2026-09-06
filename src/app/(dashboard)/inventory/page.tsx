import { getSession } from "@/lib/auth";
import { getProducts, getCategories } from "@/actions/product";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const isOwner = session.role === Role.OWNER;
  const initialProducts = await getProducts();
  const categories = await getCategories();

  return (
    <InventoryClient
      initialProducts={initialProducts}
      categories={categories}
      isOwner={isOwner}
    />
  );
}
