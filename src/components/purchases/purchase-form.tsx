"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { PaymentType } from "@prisma/client";
import { recordPurchase } from "@/actions/purchase";
import { Plus, Trash2, Truck, Loader2 } from "lucide-react";

interface PurchaseFormProps {
  products: any[];
  onSuccess: () => void;
}

export function PurchaseForm({ products, onSuccess }: PurchaseFormProps) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CASH);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<
    Array<{ productId: string; quantity: number; purchasePrice: number }>
  >([
    {
      productId: products[0]?.id || "",
      quantity: 1,
      purchasePrice: products[0]?.purchasePrice || 0,
    },
  ]);

  const handleProductSelect = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              productId,
              purchasePrice: selected?.purchasePrice || it.purchasePrice,
            }
          : it
      )
    );
  };

  const handleItemChange = (index: number, field: string, val: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: val } : it))
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: products[0]?.id || "",
        quantity: 1,
        purchasePrice: products[0]?.purchasePrice || 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce(
    (sum, it) => sum + it.quantity * it.purchasePrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Paling tidak harus ada 1 barang.");
      return;
    }

    if (paymentType === PaymentType.DEBT && !dueDate) {
      setError("Tanggal jatuh tempo wajib ditentukan untuk hutang distributor.");
      return;
    }

    setLoading(true);

    try {
      await recordPurchase({
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim() || undefined,
        invoiceNumber: invoiceNumber.trim(),
        purchaseDate,
        paymentType,
        dueDate: paymentType === PaymentType.DEBT ? dueDate : undefined,
        notes: notes.trim() || undefined,
        items,
      });

      // Reset Form
      setSupplierName("");
      setSupplierPhone("");
      setInvoiceNumber("");
      setNotes("");
      setDueDate("");
      setItems([
        {
          productId: products[0]?.id || "",
          quantity: 1,
          purchasePrice: products[0]?.purchasePrice || 0,
        },
      ]);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal mencatat pembelian stok.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg font-bold">
            Form Pencatatan Kulakan dari Distributor
          </CardTitle>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
              {error}
            </div>
          )}

          {/* Supplier & Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Nama Distributor / Supplier <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="cth: PT Warna Prima Abadi"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                No. Faktur / Surat Jalan <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="cth: SJ-2026-891"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Tanggal Barang Masuk <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Rincian Barang Masuk
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={handleAddItem}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Baris
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => {
                const prod = products.find((p) => p.id === it.productId);
                const subtotal = it.quantity * it.purchasePrice;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs"
                  >
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        Pilih Barang & Satuan
                      </label>
                      <select
                        className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs"
                        value={it.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        required
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.unit}) - Stok Saat Ini: {p.stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-28">
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        Jumlah Masuk ({prod?.unit || "Unit"})
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", Number(e.target.value))
                        }
                        required
                      />
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="text-[10px] text-muted-foreground block mb-1">
                        Harga Modal Satuan (Rp)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={it.purchasePrice}
                        onChange={(e) =>
                          handleItemChange(idx, "purchasePrice", Number(e.target.value))
                        }
                        required
                      />
                    </div>

                    <div className="w-full sm:w-36 text-right sm:self-center pt-2 sm:pt-4">
                      <div className="text-[10px] text-muted-foreground">Subtotal:</div>
                      <div className="font-bold text-foreground font-mono">
                        {formatRupiah(subtotal)}
                      </div>
                    </div>

                    <div className="self-end sm:self-center pt-2 sm:pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method & Total */}
          <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Metode Pembayaran ke Supplier
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentType === PaymentType.CASH ? "default" : "outline"}
                    className="text-xs flex-1 h-9"
                    onClick={() => setPaymentType(PaymentType.CASH)}
                  >
                    Tunai / Lunas (Potong Kas)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentType === PaymentType.DEBT ? "default" : "outline"}
                    className="text-xs flex-1 h-9"
                    onClick={() => setPaymentType(PaymentType.DEBT)}
                  >
                    Tempo / Hutang Supplier
                  </Button>
                </div>
              </div>

              {paymentType === PaymentType.DEBT && (
                <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/20 space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Jatuh Tempo Tagihan Distributor <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between p-4 rounded-xl border bg-muted/40">
              <span className="text-xs text-muted-foreground font-medium">
                Total Tagihan Faktur Pembelian:
              </span>
              <span className="text-2xl font-bold text-foreground font-mono">
                {formatRupiah(totalAmount)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {paymentType === PaymentType.CASH
                  ? "Akan langsung mengurangi saldo kas toko (Buku Kas - Kulakan)."
                  : "Akan masuk ke dashboard Hutang Toko dengan tanggal jatuh tempo."}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-6 border-t flex justify-end">
          <Button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full sm:w-auto h-10 px-6 font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pembelian & Tambah Stok
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
