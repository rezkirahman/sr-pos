"use client";

import { useState } from "react";
import { CartItem } from "@/lib/validations/pos";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { ShoppingBag, ChevronUp } from "lucide-react";
import { CartView } from "./cart-view";

interface MobileCartBarProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function MobileCartBar({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: MobileCartBarProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const totalAmount = items.reduce(
    (sum, i) => sum + i.quantity * i.sellingPrice,
    0
  );
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-card border-t shadow-2xl">
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <Badge
                variant="danger"
                className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 text-[10px] font-bold flex items-center justify-center rounded-full"
              >
                {totalItems}
              </Badge>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground leading-none">Total Belanja</div>
              <div className="font-bold text-sm text-foreground mt-0.5 font-mono">
                {formatRupiah(totalAmount)}
              </div>
            </div>
          </div>

          <SheetTrigger asChild>
            <Button className="h-10 px-4 text-xs font-semibold gap-1.5 shadow">
              <span>Lihat Keranjang</span>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col rounded-t-2xl">
          <SheetHeader className="p-4 border-b text-left">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> Keranjang Belanja Kasir
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-3">
            <CartView
              items={items}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              onClearCart={() => {
                onClearCart();
                setOpen(false);
              }}
              onCheckout={() => {
                setOpen(false);
                onCheckout();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
