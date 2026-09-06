"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { History, Edit3, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { ProductDialog } from "./product-dialog";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import { StockMovementDrawer } from "./stock-movement-drawer";

interface ProductTableProps {
  products: any[];
  isOwner: boolean;
  categories: string[];
  onRefresh: () => void;
}

export function ProductTable({
  products,
  isOwner,
  categories,
  onRefresh,
}: ProductTableProps) {
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<any>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState<any>(null);

  if (products.length === 0) {
    return (
      <div className="p-12 text-center border rounded-xl bg-card">
        <p className="text-muted-foreground text-sm">Tidak ada data produk yang sesuai kriteria.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Nama Barang & Varian</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Satuan</TableHead>
              {isOwner && <TableHead className="text-right">Harga Modal (HPP)</TableHead>}
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-center">Sisa Stok</TableHead>
              <TableHead className="text-right w-[160px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const isOut = p.stock <= 0;
              const isLow = p.stock > 0 && p.stock <= p.minStockAlert;

              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.sku || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {isLow && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" title="Stok Menipis" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.unit}</TableCell>
                  {isOwner && (
                    <TableCell className="text-right text-xs font-medium text-muted-foreground">
                      {p.purchasePrice !== null ? formatRupiah(p.purchasePrice) : "-"}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-semibold text-foreground">
                    {formatRupiah(p.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={isOut ? "danger" : isLow ? "warning" : "success"}
                      className="text-xs font-bold px-2 py-0.5"
                    >
                      {p.stock} {p.unit}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Lihat Kartu Stok"
                        onClick={() => setSelectedProductForMovement(p)}
                      >
                        <History className="h-4 w-4" />
                      </Button>

                      {isOwner && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                            title="Penyesuaian Stok (Opname)"
                            onClick={() => setSelectedProductForAdj(p)}
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Edit Data Barang"
                            onClick={() => setSelectedProductForEdit(p)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View (< 768px) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {products.map((p) => {
          const isOut = p.stock <= 0;
          const isLow = p.stock > 0 && p.stock <= p.minStockAlert;

          return (
            <div
              key={p.id}
              className="p-4 rounded-xl border bg-card shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-muted-foreground">{p.sku || "Tanpa SKU"}</div>
                  <div className="font-semibold text-sm leading-snug mt-0.5">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.category} • Satuan: {p.unit}
                  </div>
                </div>
                <Badge
                  variant={isOut ? "danger" : isLow ? "warning" : "success"}
                  className="text-xs font-bold shrink-0"
                >
                  {p.stock} {p.unit}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t pt-2.5 text-xs">
                <div>
                  {isOwner && p.purchasePrice !== null && (
                    <div className="text-muted-foreground">
                      HPP: <span>{formatRupiah(p.purchasePrice)}</span>
                    </div>
                  )}
                  <div className="font-bold text-sm text-foreground">
                    {formatRupiah(p.sellingPrice)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1"
                    onClick={() => setSelectedProductForMovement(p)}
                  >
                    <History className="h-3.5 w-3.5" /> Riwayat
                  </Button>

                  {isOwner && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1"
                        onClick={() => setSelectedProductForAdj(p)}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" /> Opname
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedProductForEdit(p)}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Movement Drawer */}
      <StockMovementDrawer
        open={!!selectedProductForMovement}
        onOpenChange={(open) => !open && setSelectedProductForMovement(null)}
        product={selectedProductForMovement}
      />

      {/* Stock Opname Modal */}
      {isOwner && (
        <StockAdjustmentDialog
          open={!!selectedProductForAdj}
          onOpenChange={(open) => !open && setSelectedProductForAdj(null)}
          product={selectedProductForAdj}
          onSuccess={onRefresh}
        />
      )}

      {/* Edit Product Modal */}
      {isOwner && (
        <ProductDialog
          open={!!selectedProductForEdit}
          onOpenChange={(open) => !open && setSelectedProductForEdit(null)}
          initialData={selectedProductForEdit}
          categories={categories}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
