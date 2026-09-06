"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { PaymentType } from "@prisma/client";
import { checkoutTransaction } from "@/actions/pos";
import { CartItem } from "@/lib/validations/pos";
import { Banknote, QrCode, FileText, Loader2 } from "lucide-react";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  totalAmount: number;
  onSuccess: (transaction: any) => void;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  items,
  totalAmount,
  onSuccess,
}: CheckoutDialogProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CASH);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentType(PaymentType.CASH);
      setCashReceived(String(totalAmount));
      setCustomerName("");
      setCustomerPhone("");
      // Default due date: 14 days from today
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setDueDate(d.toISOString().split("T")[0]);
      setNotes("");
      setError(null);
    }
  }, [open, totalAmount]);

  const cashNum = Number(cashReceived || 0);
  const change = Math.max(0, cashNum - totalAmount);
  const isCashInsufficient = paymentType === PaymentType.CASH && cashNum < totalAmount;

  const handleShortcutCash = (amount: number) => {
    setCashReceived(String(amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentType === PaymentType.CASH && isCashInsufficient) {
      setError("Nominal uang tunai yang dibayarkan kurang dari total belanja!");
      return;
    }

    if (paymentType === PaymentType.DEBT && !customerName.trim()) {
      setError("Nama pelanggan/tukang wajib diisi untuk transaksi Bon!");
      return;
    }

    if (paymentType === PaymentType.DEBT && !dueDate) {
      setError("Tanggal jatuh tempo wajib ditentukan untuk Bon!");
      return;
    }

    setLoading(true);

    try {
      const res = await checkoutTransaction({
        items,
        paymentType,
        cashReceived: paymentType === PaymentType.CASH ? cashNum : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        dueDate: paymentType === PaymentType.DEBT ? dueDate : undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onOpenChange(false);
        onSuccess(res.transaction);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memproses transaksi kasir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Penyelesaian Transaksi Kasir</DialogTitle>
          <div className="text-xs text-muted-foreground">
            Total Tagihan Belanja: <strong className="text-foreground text-sm">{formatRupiah(totalAmount)}</strong>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
              {error}
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={paymentType === PaymentType.CASH ? "default" : "outline"}
                className="h-14 flex flex-col gap-1 text-xs"
                onClick={() => setPaymentType(PaymentType.CASH)}
              >
                <Banknote className="h-5 w-5" />
                <span>Tunai (Cash)</span>
              </Button>

              <Button
                type="button"
                variant={paymentType === PaymentType.TRANSFER ? "default" : "outline"}
                className="h-14 flex flex-col gap-1 text-xs"
                onClick={() => setPaymentType(PaymentType.TRANSFER)}
              >
                <QrCode className="h-5 w-5" />
                <span>Transfer / QRIS</span>
              </Button>

              <Button
                type="button"
                variant={paymentType === PaymentType.DEBT ? "default" : "outline"}
                className="h-14 flex flex-col gap-1 text-xs"
                onClick={() => setPaymentType(PaymentType.DEBT)}
              >
                <FileText className="h-5 w-5 text-amber-500" />
                <span>Bon (Tempo)</span>
              </Button>
            </div>
          </div>

          {/* CASH Form */}
          {paymentType === PaymentType.CASH && (
            <div className="space-y-3 p-3.5 rounded-lg border bg-muted/30">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Uang Diterima (Rp)</label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="font-mono text-base font-bold"
                  required
                  autoFocus
                />
              </div>

              {/* Cash Quick Shortcut Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  onClick={() => handleShortcutCash(totalAmount)}
                >
                  Uang Pas
                </Button>
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2 font-mono"
                    onClick={() => handleShortcutCash(amt)}
                  >
                    {formatRupiah(amt)}
                  </Button>
                ))}
              </div>

              {/* Kembalian Calculation Display */}
              <div className="flex items-center justify-between border-t pt-2 text-sm">
                <span className="text-muted-foreground text-xs font-medium">Uang Kembalian:</span>
                <span
                  className={`font-mono text-base font-bold ${
                    isCashInsufficient ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isCashInsufficient ? "Uang Kurang" : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {/* TRANSFER Form */}
          {paymentType === PaymentType.TRANSFER && (
            <div className="space-y-3 p-3.5 rounded-lg border bg-muted/30 text-xs">
              <p className="text-muted-foreground">
                Pastikan bukti transfer telah terverifikasi di mutasi bank atau notifikasi QRIS telah sukses sebelum menyelesaikan transaksi.
              </p>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nama Bank / Ref Transfer (Opsional)</label>
                <Input
                  placeholder="cth: BCA / QRIS Nobu"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* DEBT / BON Form */}
          {paymentType === PaymentType.DEBT && (
            <div className="space-y-3 p-3.5 rounded-lg border bg-amber-500/10 border-amber-500/30">
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <span>Pencatatan Bon / Piutang Pelanggan</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Nama Pelanggan / Tukang <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="cth: Pak Joko (Mandor Proyek)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">No. Telepon / WA</label>
                  <Input
                    placeholder="0812xxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Tanggal Jatuh Tempo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Catatan / Keterangan Bon</label>
                <Input
                  placeholder="cth: Diambil kuli panggul untuk proyek jalan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || (paymentType === PaymentType.CASH && isCashInsufficient)}
              className="font-semibold shadow"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi & Selesai
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
