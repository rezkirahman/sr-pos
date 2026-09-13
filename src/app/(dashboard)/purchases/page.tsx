import { getSession, userHasPermission } from "@/lib/auth";
import { getProducts } from "@/actions/product";
import { getRecentPurchases } from "@/actions/purchase";
import { redirect } from "next/navigation";
import { PurchasesClient } from "./purchases-client";

export default async function PurchasesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!userHasPermission(session, "purchases", "view")) {
    redirect("/pos");
  }

  const products = await getProducts();
  const recentPurchases = await getRecentPurchases();

  return (
    <PurchasesClient products={products} initialPurchases={recentPurchases} />
  );
}
