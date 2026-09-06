"use client";

import { CartItem } from "@/lib/validations/pos";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

interface CartViewProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartView({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartViewProps) {
  const totalAmount = items.reduce(
    (sum, i) => sum + i.quantity * i.sellingPrice,
    0
  );
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-base">Keranjang Belanja</h2>
          <span className="text-xs text-muted-foreground">({totalItems} item)</span>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
          >
            Kosongkan
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">Keranjang masih kosong</p>
            <p className="text-xs mt-0.5">Pilih barang dari katalog untuk menambahkan ke transaksi.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="p-3 rounded-lg border bg-muted/20 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm leading-snug line-clamp-2">
                  {item.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onRemoveItem(item.productId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground font-mono">
                  {formatRupiah(item.sellingPrice)} / {item.unit}
                </span>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 border rounded-lg p-0.5 bg-background">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded"
                    onClick={() => onUpdateQuantity(item.productId, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-bold text-xs">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded"
                    onClick={() => onUpdateQuantity(item.productId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between border-t pt-1.5 font-medium">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-bold text-foreground">
                  {formatRupiah(item.quantity * item.sellingPrice)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Subtotal & Checkout Button */}
      <div className="p-4 border-t bg-muted/10 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total Item:</span>
            <span>{totalItems} unit</span>
          </div>
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Total Bayar:</span>
            <span className="text-primary">{formatRupiah(totalAmount)}</span>
          </div>
        </div>

        <Button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full h-11 text-sm font-semibold gap-2 shadow"
        >
          <span>Lanjut ke Pembayaran</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
