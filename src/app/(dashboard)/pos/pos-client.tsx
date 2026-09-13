"use client";

import { useState, useRef } from "react";
import { CartItem } from "@/lib/validations/pos";
import { formatRupiah } from "@/lib/utils";
import { CartView } from "@/components/pos/cart-view";
import { MobileCartBar } from "@/components/pos/mobile-cart-bar";
import { CheckoutDialog } from "@/components/pos/checkout-dialog";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Barcode, ShoppingCart, AlertCircle } from "lucide-react";
import { getProducts } from "@/actions/product";

interface PosClientProps {
  initialProducts: any[];
  categories: string[];
  storeName?: string;
}

export function PosClient({ initialProducts, categories, storeName }: PosClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [openCheckout, setOpenCheckout] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Maksimal stok tersedia untuk ${product.name} adalah ${product.stock} ${product.unit}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          quantity: 1,
          sellingPrice: product.sellingPrice,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p.id === productId);
            const newQty = item.quantity + delta;

            if (product && newQty > product.stock) {
              alert(`Stok tidak mencukupi. Tersedia: ${product.stock} ${product.unit}`);
              return item;
            }

            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Barcode / Fast SKU Enter Key
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = barcodeInput.trim();
    if (!val) return;

    const matched = products.find(
      (p) => p.sku && p.sku.toLowerCase() === val.toLowerCase()
    );

    if (matched) {
      handleAddToCart(matched);
      setBarcodeInput("");
    } else {
      alert(`Barang dengan barcode/SKU "${val}" tidak ditemukan.`);
    }
  };

  const refreshProducts = async () => {
    try {
      const updated = await getProducts();
      setProducts(updated);
    } catch (err) {
      console.error("Gagal refresh produk:", err);
    }
  };

  const handleCheckoutSuccess = (trx: any) => {
    setCompletedTransaction(trx);
    setCart([]);
    refreshProducts();
  };

  const totalAmount = cart.reduce(
    (sum, i) => sum + i.quantity * i.sellingPrice,
    0
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Left: Product Catalog & Fast Search */}
      <div className="flex-1 flex flex-col space-y-3 min-w-0">
        {/* Search & Barcode Quick Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Cari nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm bg-card"
            />
          </div>

          {/* Barcode Scanner Direct Input */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan / Ketik Barcode + Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-card"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs shrink-0">
              Input
            </Button>
          </form>
        </div>

        {/* Categories Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <Button
            type="button"
            size="sm"
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            className="h-7 text-xs px-3 rounded-full shrink-0"
            onClick={() => setSelectedCategory("ALL")}
          >
            Semua
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              className="h-7 text-xs px-3 rounded-full shrink-0"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground border rounded-xl bg-card">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((p) => {
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStockAlert;
                const inCartItem = cart.find((i) => i.productId === p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOut && handleAddToCart(p)}
                    className={`group relative p-3 rounded-xl border bg-card text-left transition-all flex flex-col justify-between select-none ${
                      isOut
                        ? "opacity-50 cursor-not-allowed bg-muted/20"
                        : "cursor-pointer hover:border-primary hover:shadow-md active:scale-[0.98]"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          {p.sku || p.category}
                        </span>
                        <Badge
                          variant={isOut ? "danger" : isLow ? "warning" : "success"}
                          className="text-[10px] px-1.5 py-0 font-bold shrink-0"
                        >
                          {p.stock} {p.unit}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-center justify-between">
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {formatRupiah(p.sellingPrice)}
                      </div>

                      {inCartItem ? (
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {inCartItem.quantity}
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full border border-muted-foreground/30 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary text-muted-foreground flex items-center justify-center transition-colors">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Desktop Cart Sidebar (Fixed width on desktop) */}
      <div className="hidden md:block w-80 lg:w-96 shrink-0 h-[calc(100vh-6rem)] sticky top-20">
        <CartView
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={() => setOpenCheckout(true)}
        />
      </div>

      {/* Mobile Cart Floating Action Bar */}
      <MobileCartBar
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={() => setOpenCheckout(true)}
      />

      {/* Checkout Modal */}
      <CheckoutDialog
        open={openCheckout}
        onOpenChange={setOpenCheckout}
        items={cart}
        totalAmount={totalAmount}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Digital Receipt Modal */}
      <ReceiptModal
        open={!!completedTransaction}
        onOpenChange={(open) => !open && setCompletedTransaction(null)}
        transaction={completedTransaction}
        onNewTransaction={() => setCompletedTransaction(null)}
        storeName={storeName}
      />
    </div>
  );
}
