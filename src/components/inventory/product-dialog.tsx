"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProduct, updateProduct } from "@/actions/product";
import { Loader2 } from "lucide-react";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  categories: string[];
  onSuccess: () => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  initialData,
  categories,
  onSuccess,
}: ProductDialogProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [unit, setUnit] = useState("Kaleng");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [minStockAlert, setMinStockAlert] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setSku(initialData.sku || "");
      setName(initialData.name || "");
      setCategory(initialData.category || "");
      setUnit(initialData.unit || "Kaleng");
      setPurchasePrice(initialData.purchasePrice ? String(initialData.purchasePrice) : "0");
      setSellingPrice(String(initialData.sellingPrice || "0"));
      setStock(String(initialData.stock || "0"));
      setMinStockAlert(String(initialData.minStockAlert || "5"));
    } else {
      setSku("");
      setName("");
      setCategory(categories[0] || "Cat Tembok");
      setUnit("Kaleng");
      setPurchasePrice("");
      setSellingPrice("");
      setStock("0");
      setMinStockAlert("5");
    }
    setError(null);
  }, [initialData, open, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalCategory = category === "__NEW__" ? newCategory.trim() : category;
    if (!finalCategory) {
      setError("Kategori harus diisi");
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await updateProduct(initialData.id, {
          sku: sku.trim() || null,
          name: name.trim(),
          category: finalCategory,
          unit: unit.trim(),
          purchasePrice: Number(purchasePrice),
          sellingPrice: Number(sellingPrice),
          minStockAlert: Number(minStockAlert),
        });
      } else {
        await createProduct({
          sku: sku.trim() || null,
          name: name.trim(),
          category: finalCategory,
          unit: unit.trim(),
          purchasePrice: Number(purchasePrice),
          sellingPrice: Number(sellingPrice),
          stock: Number(stock),
          minStockAlert: Number(minStockAlert),
          isActive: true,
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Data Barang" : "Tambah Barang Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">SKU / Kode Barcode</label>
              <Input
                placeholder="cth: CAT-VNLX-005"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Satuan Barang</label>
              <Input
                placeholder="cth: Kaleng, Galon, Pail, Sak, Dus, Pcs"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nama Barang / Varian Ukuran</label>
            <Input
              placeholder="cth: Cat Vinilex 5 Kg Brilliant White"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Kategori</label>
              <select
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__NEW__">+ Buat Kategori Baru...</option>
              </select>
            </div>
            {category === "__NEW__" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nama Kategori Baru</label>
                <Input
                  placeholder="Ketik kategori baru"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Harga Modal (HPP)</label>
              <Input
                type="number"
                placeholder="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Harga Jual Eceran</label>
              <Input
                type="number"
                placeholder="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isEditing && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Stok Awal</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Batas Minimum Stok (Alert)</label>
              <Input
                type="number"
                placeholder="5"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" rounded="full" disabled={loading} className="font-semibold shadow px-6">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Perbarui Barang" : "Simpan Barang"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
