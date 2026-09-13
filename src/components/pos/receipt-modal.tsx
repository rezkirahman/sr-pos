"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { CheckCircle2, Printer, ShoppingBag } from "lucide-react";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
  onNewTransaction: () => void;
  storeName?: string;
}

export function ReceiptModal({
  open,
  onOpenChange,
  transaction,
  onNewTransaction,
  storeName,
}: ReceiptModalProps) {
  if (!transaction) return null;

  const dateFormatted = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(transaction.createdAt));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <DialogTitle className="text-lg font-bold">Transaksi Berhasil</DialogTitle>
          <div className="text-xs text-muted-foreground">Nota Kasir Digital Toko</div>
        </DialogHeader>

        {/* Receipt Box */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3 font-mono text-xs">
          <div className="text-center border-b pb-2 space-y-0.5">
            <div className="font-bold text-sm font-sans uppercase">{storeName || "SUMBER REJEKI"}</div>
            <div className="text-[11px] text-muted-foreground">Toko Cat & Bangunan</div>
            <div className="text-[10px] text-muted-foreground">{dateFormatted}</div>
          </div>

          <div className="flex justify-between text-[11px] border-b pb-2">
            <span>No: <strong>{transaction.invoiceNumber}</strong></span>
            <span>Pelanggan: <strong>{transaction.customerName || "Umum"}</strong></span>
          </div>

          {/* Items */}
          <div className="space-y-1.5 border-b pb-2">
            {transaction.items?.map((item: any) => (
              <div key={item.id} className="space-y-0.5">
                <div className="font-medium truncate">{item.product?.name || "Barang"}</div>
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {item.quantity} x {formatRupiah(item.unitPrice)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between font-bold text-xs">
              <span>TOTAL</span>
              <span>{formatRupiah(transaction.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Metode Bayar</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                {transaction.paymentType}
              </Badge>
            </div>
            {transaction.paymentType === "CASH" && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tunai Diterima</span>
                  <span>{formatRupiah(transaction.cashReceived || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Kembalian</span>
                  <span>{formatRupiah(transaction.changeAmount || 0)}</span>
                </div>
              </>
            )}
            {transaction.paymentType === "DEBT" && (
              <div className="mt-1 p-2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-sans text-[11px]">
                Status: <strong>BON / TEMPO</strong> (Tercatat di Piutang)
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            rounded="full"
            onClick={() => window.print()}
            className="w-full sm:w-auto gap-1 text-xs"
          >
            <Printer className="h-3.5 w-3.5" /> Cetak Nota
          </Button>
          <Button
            rounded="full"
            onClick={() => {
              onOpenChange(false);
              onNewTransaction();
            }}
            className="w-full sm:w-auto gap-1 font-semibold text-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Transaksi Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
