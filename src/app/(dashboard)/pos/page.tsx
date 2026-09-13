import { getSession } from "@/lib/auth";
import { getProducts, getCategories } from "@/actions/product";
import { redirect } from "next/navigation";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const products = await getProducts();
  const categories = await getCategories();

  return (
    <PosClient
      initialProducts={products}
      categories={categories}
      storeName={session.storeName || "Toko POS"}
    />
  );
}
