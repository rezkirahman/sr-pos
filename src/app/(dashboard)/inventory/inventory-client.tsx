"use client";

import { useState } from "react";
import { ProductTable } from "@/components/inventory/product-table";
import { ProductDialog } from "@/components/inventory/product-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProducts } from "@/actions/product";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";

interface InventoryClientProps {
  initialProducts: any[];
  categories: string[];
  isOwner: boolean;
}

export function InventoryClient({
  initialProducts,
  categories,
  isOwner,
}: InventoryClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [filter, setFilter] = useState<"all" | "low" | "empty">("all");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchFilteredProducts = async (
    customFilter?: "all" | "low" | "empty",
    customCat?: string,
    customSearch?: string
  ) => {
    setLoading(true);
    try {
      const data = await getProducts({
        filter: customFilter !== undefined ? customFilter : filter,
        category: customCat !== undefined ? customCat : category,
        search: customSearch !== undefined ? customSearch : search,
      });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    fetchFilteredProducts(filter, category, val);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    fetchFilteredProducts(filter, val, search);
  };

  const handleFilterTabChange = (val: string) => {
    const f = val as "all" | "low" | "empty";
    setFilter(f);
    fetchFilteredProducts(f, category, search);
  };

  const totalLow = products.filter((p) => p.stock <= p.minStockAlert && p.stock > 0).length;
  const totalEmpty = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            {isOwner ? "Master Produk & Rekap Stok" : "Katalog & Stok Barang"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Kelola data persediaan eceran dan grosir dengan kartu mutasi otomatis.
          </p>
        </div>

        {isOwner && (
          <Button
            onClick={() => setOpenAddDialog(true)}
            className="w-full sm:w-auto gap-2 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" /> Tambah Barang Baru
          </Button>
        )}
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <Tabs
          value={filter}
          onValueChange={handleFilterTabChange}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full md:w-auto h-9">
            <TabsTrigger value="all" className="text-xs">
              Semua ({products.length})
            </TabsTrigger>
            <TabsTrigger value="low" className="text-xs text-amber-600 dark:text-amber-400">
              Menipis {totalLow > 0 && `(${totalLow})`}
            </TabsTrigger>
            <TabsTrigger value="empty" className="text-xs text-destructive">
              Habis {totalEmpty > 0 && `(${totalEmpty})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama barang / barcode..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm"
            />
          </div>

          <div className="relative w-36 sm:w-44 shrink-0">
            <select
              className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fetchFilteredProducts()}
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Product List */}
      <ProductTable
        products={products}
        isOwner={isOwner}
        categories={categories}
        onRefresh={() => fetchFilteredProducts()}
      />

      {/* Add Product Modal */}
      {isOwner && (
        <ProductDialog
          open={openAddDialog}
          onOpenChange={setOpenAddDialog}
          categories={categories}
          onSuccess={() => fetchFilteredProducts()}
        />
      )}
    </div>
  );
}
