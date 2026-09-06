"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { getStockMovements } from "@/actions/product";
import { Loader2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

interface StockMovementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export function StockMovementDrawer({
  open,
  onOpenChange,
  product,
}: StockMovementDrawerProps) {
  const [cachedProduct, setCachedProduct] = useState(product);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setCachedProduct(product);
    }
  }, [product]);

  const activeProduct = product || cachedProduct;

  useEffect(() => {
    if (activeProduct && open) {
      setLoading(true);
      getStockMovements(activeProduct.id)
        .then((data) => setMovements(data))
        .catch(() => setMovements([]))
        .finally(() => setLoading(false));
    }
  }, [activeProduct, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b text-left">
          <SheetTitle className="text-base font-bold">Kartu Riwayat Stok</SheetTitle>
          <SheetDescription className="text-xs">
            {activeProduct?.name || "-"} ({activeProduct?.unit || "-"})
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat riwayat...
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              Belum ada mutasi stok tercatat untuk barang ini.
            </div>
          ) : (
            movements.map((m) => {
              const isOut = m.type === "OUT";
              const isIn = m.type === "IN";
              const isAdj = m.type === "ADJUSTMENT";

              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-lg border bg-card text-sm space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isIn && <ArrowDownRight className="h-4 w-4 text-emerald-600" />}
                      {isOut && <ArrowUpRight className="h-4 w-4 text-destructive" />}
                      {isAdj && <RefreshCw className="h-4 w-4 text-amber-500" />}

                      <Badge
                        variant={isIn ? "success" : isOut ? "danger" : "warning"}
                        className="text-[10px]"
                      >
                        {isIn ? "MASUK" : isOut ? "KELUAR" : "OPNAME"}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(m.createdAt))}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      Stok: {m.stockBefore} &rarr; <strong>{m.stockAfter}</strong>
                    </span>
                    <strong
                      className={
                        isIn
                          ? "text-emerald-600 font-bold"
                          : isOut
                          ? "text-destructive font-bold"
                          : "text-foreground font-bold"
                      }
                    >
                      {isIn ? `+${m.quantity}` : isOut ? `-${m.quantity}` : `Δ ${m.quantity}`} {activeProduct?.unit || ""}
                    </strong>
                  </div>

                  {m.notes && (
                    <div className="text-xs text-muted-foreground italic bg-muted/30 p-1.5 rounded">
                      &ldquo;{m.notes}&rdquo;
                    </div>
                  )}

                  <div className="text-[10px] text-muted-foreground/80 flex justify-between pt-0.5">
                    <span>Petugas: {m.createdBy?.name || "-"}</span>
                    {m.referenceId && <span>Ref: {m.referenceId}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
