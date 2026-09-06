import { z } from "zod";

export const expenseCategories = [
  "Listrik / Air / Internet",
  "Gaji & Uang Makan Pegawai",
  "BBM & Ongkos Angkut Pickup",
  "Perlengkapan & Kebersihan Toko",
  "Konsumsi & Keperluan Harian",
  "Perbaikan & Perawatan Toko",
  "Pengeluaran Lain-lain",
] as const;

export const expenseSchema = z.object({
  category: z.string().min(1, "Pilih kategori pengeluaran"),
  amount: z.coerce.number().min(1, "Nominal pengeluaran minimal Rp 1"),
  description: z.string().min(3, "Keterangan pengeluaran minimal 3 karakter"),
  expenseDate: z.string().min(1, "Tanggal pengeluaran harus diisi"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
