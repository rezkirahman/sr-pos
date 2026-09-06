import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().optional().nullable(),
  name: z.string().min(2, "Nama barang minimal 2 karakter"),
  category: z.string().min(1, "Kategori harus diisi"),
  unit: z.string().min(1, "Satuan harus diisi (cth: Kaleng, Galon, Pail, Sak, Pcs)"),
  purchasePrice: z.coerce.number().min(0, "Harga modal minimal 0"),
  sellingPrice: z.coerce.number().min(0, "Harga jual minimal 0"),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh minus"),
  minStockAlert: z.coerce.number().int().min(0, "Batas minimum stok tidak boleh minus"),
  isActive: z.boolean().default(true),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  actualStock: z.coerce.number().int().min(0, "Stok fisik sebenarnya minimal 0"),
  notes: z.string().min(3, "Alasan penyesuaian stok harus dicantumkan (minimal 3 karakter)"),
});

export type CreateProductInput = z.infer<typeof productSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
