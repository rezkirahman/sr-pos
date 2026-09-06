"use client";

import { useState } from "react";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { getRecentPurchases } from "@/actions/purchase";
import { ArrowDownRight, History } from "lucide-react";

interface PurchasesClientProps {
  products: any[];
  initialPurchases: any[];
}

export function PurchasesClient({
  products,
  initialPurchases,
}: PurchasesClientProps) {
  const [purchases, setPurchases] = useState(initialPurchases);

  const refreshPurchases = async () => {
    try {
      const updated = await getRecentPurchases();
      setPurchases(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Kulakan Stok dari Distributor
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Pencatatan faktur barang masuk dari supplier, penambahan stok gudang otomatis, dan pembaruan harga beli HPP.
        </p>
      </div>

      {/* Entry Form */}
      <PurchaseForm products={products} onSuccess={refreshPurchases} />

      {/* History Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-bold text-base">Riwayat Penerimaan Barang Kulakan</h2>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-sm">
            Belum ada riwayat kulakan distributor.
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[140px]">Tanggal</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="w-[160px]">Faktur / Referensi</TableHead>
                  <TableHead className="text-center w-[120px]">Jumlah Masuk</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right w-[140px]">Petugas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(p.createdAt))}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {p.product?.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.referenceId || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="success" className="gap-1 font-bold text-xs">
                        <ArrowDownRight className="h-3 w-3" />
                        +{p.quantity} {p.product?.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.notes}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {p.createdBy?.name || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
