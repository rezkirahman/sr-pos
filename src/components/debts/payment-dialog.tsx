"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { recordDebtPayment } from "@/actions/debt";
import { DebtType } from "@prisma/client";
import { Loader2, Banknote, QrCode } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: any;
  onSuccess: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  debt,
  onSuccess,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debt && open) {
      setAmount(String(debt.remainingAmount));
      setPaymentMethod("Tunai");
      setNotes("");
      setError(null);
    }
  }, [debt, open]);

  if (!debt) return null;

  const isReceivable = debt.type === DebtType.RECEIVABLE;
  const remaining = debt.remainingAmount || 0;
  const payNum = Number(amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (payNum <= 0) {
      setError("Nominal pembayaran harus lebih besar dari Rp 0.");
      return;
    }

    if (payNum > remaining) {
      setError(`Nominal pembayaran melebihi sisa tagihan (${formatRupiah(remaining)}).`);
      return;
    }

    setLoading(true);

    try {
      await recordDebtPayment(debt.id, payNum, paymentMethod, notes.trim());
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal mencatat pembayaran cicilan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">
            {isReceivable ? "Penerimaan Cicilan Piutang" : "Pembayaran Hutang ke Supplier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-lg border bg-muted/40 space-y-1 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">{isReceivable ? "Pelanggan:" : "Distributor:"}</span>
              <span className="font-bold text-foreground">{debt.contactName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Tagihan Awal:</span>
              <span className="font-mono">{formatRupiah(debt.totalAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold text-sm">
              <span className="text-muted-foreground">Sisa Tagihan:</span>
              <span className="text-destructive font-mono">{formatRupiah(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Nominal yang Dibayar (Rp)
            </label>
            <Input
              type="number"
              min="1"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono font-bold text-base"
              required
              autoFocus
            />
            <div className="flex gap-1.5 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2 font-medium"
                onClick={() => setAmount(String(remaining))}
              >
                Lunasi Sisa ({formatRupiah(remaining)})
              </Button>
              {remaining > 100000 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2 font-mono"
                  onClick={() => setAmount("100000")}
                >
                  100k
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === "Tunai" ? "default" : "outline"}
                className="h-9 text-xs gap-1.5"
                onClick={() => setPaymentMethod("Tunai")}
              >
                <Banknote className="h-4 w-4" /> Tunai
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "Transfer" ? "default" : "outline"}
                className="h-9 text-xs gap-1.5"
                onClick={() => setPaymentMethod("Transfer")}
              >
                <QrCode className="h-4 w-4" /> Transfer Bank
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Catatan / Keterangan Pembayaran
            </label>
            <Input
              placeholder="cth: Dititip via tukang / transfer bank BCA"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            <Button type="submit" disabled={loading} className="font-semibold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
