"use client";

import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustStock } from "@/actions/product";
import { Loader2 } from "lucide-react";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onSuccess: () => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [actualStock, setActualStock] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (product) {
      setActualStock(String(product.stock));
      setNotes("");
    }
    setError(null);
  }, [product, open]);

  const current = product?.stock || 0;
  const physical = Number(actualStock || 0);
  const diff = physical - current;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setLoading(true);
    setError(null);

    try {
      await adjustStock({
        productId: product.id,
        actualStock: physical,
        notes: notes.trim(),
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal menyesuaikan stok");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok (Stock Opname)</DialogTitle>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md">
                {error}
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/60 text-sm space-y-1">
              <div className="font-semibold text-foreground">{product.name}</div>
              <div className="text-xs text-muted-foreground">
                SKU: {product.sku || "-"} • Satuan: {product.unit}
              </div>
              <div className="text-xs pt-1 flex justify-between">
                <span>Stok Tercatat di Sistem:</span>
                <strong className="text-foreground">{current} {product.unit}</strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Jumlah Stok Fisik Sebenarnya (Hasil Hitung Lapangan)
              </label>
              <Input
                type="number"
                min="0"
                value={actualStock}
                onChange={(e) => setActualStock(e.target.value)}
                required
                autoFocus
              />
              <div className="text-xs mt-1.5 flex items-center justify-between">
                <span className="text-muted-foreground">Selisih Stok:</span>
                <span
                  className={
                    diff > 0
                      ? "text-emerald-600 font-bold"
                      : diff < 0
                      ? "text-destructive font-bold"
                      : "text-muted-foreground"
                  }
                >
                  {diff > 0 ? `+${diff}` : diff} {product.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Alasan / Catatan Penyesuaian
              </label>
              <textarea
                className="w-full min-h-[70px] p-2.5 rounded-md border border-input bg-background text-sm"
                placeholder="cth: Hasil opname bulanan / barang bocor / rusak saat bongkar muat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Opname
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
