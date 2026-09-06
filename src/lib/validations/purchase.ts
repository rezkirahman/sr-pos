import { z } from "zod";
import { PaymentType } from "@prisma/client";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Pilih barang"),
  quantity: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  purchasePrice: z.coerce.number().min(0, "Harga modal minimal 0"),
});

export const purchaseSchema = z
  .object({
    supplierName: z.string().min(2, "Nama supplier minimal 2 karakter"),
    supplierPhone: z.string().optional().nullable(),
    invoiceNumber: z.string().min(2, "Nomor faktur / surat jalan wajib diisi"),
    purchaseDate: z.string().min(1, "Tanggal pembelian wajib diisi"),
    paymentType: z.nativeEnum(PaymentType),
    dueDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(purchaseItemSchema).min(1, "Daftar barang kulakan tidak boleh kosong"),
  })
  .refine(
    (data) => {
      if (data.paymentType === PaymentType.DEBT) {
        return !!data.dueDate;
      }
      return true;
    },
    {
      message: "Tanggal jatuh tempo tagihan supplier wajib diisi untuk tempo/hutang",
      path: ["dueDate"],
    }
  );

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
