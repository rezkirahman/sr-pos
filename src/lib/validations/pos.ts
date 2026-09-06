import { z } from "zod";
import { PaymentType } from "@prisma/client";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().int().min(1, "Jumlah minimal 1"),
  sellingPrice: z.number().min(0),
});

export const checkoutSchema = z
  .object({
    items: z.array(cartItemSchema).min(1, "Keranjang belanja tidak boleh kosong"),
    paymentType: z.nativeEnum(PaymentType),
    cashReceived: z.number().optional().nullable(),
    customerName: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(), // ISO date string for bon
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.paymentType === PaymentType.DEBT) {
        return !!data.customerName && data.customerName.trim().length > 0;
      }
      return true;
    },
    {
      message: "Nama pelanggan wajib diisi untuk transaksi Bon / Tempo",
      path: ["customerName"],
    }
  )
  .refine(
    (data) => {
      if (data.paymentType === PaymentType.DEBT) {
        return !!data.dueDate;
      }
      return true;
    },
    {
      message: "Tanggal jatuh tempo wajib diisi untuk transaksi Bon / Tempo",
      path: ["dueDate"],
    }
  );

export type CartItem = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
