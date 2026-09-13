"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { purchaseSchema, PurchaseInput } from "@/lib/validations/purchase";
import { MovementType, DebtType, DebtStatus, CashFlowType, PaymentType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function recordPurchase(input: PurchaseInput) {
  const session = await requirePermission("purchases", "create");
  if (!session.storeId) {
    throw new Error("Akun Super Admin tidak terikat toko untuk transaksi kulakan toko.");
  }

  const parsed = purchaseSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Calculate total
    const totalAmount = parsed.items.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );

    // 2. Process each item: update stock & HPP, create StockMovement IN
    for (const item of parsed.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, storeId: session.storeId! },
      });

      if (!product) {
        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan di toko ini.`);
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore + item.quantity;

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: stockAfter,
          purchasePrice: item.purchasePrice, // Update modal HPP
        },
      });

      await tx.stockMovement.create({
        data: {
          storeId: session.storeId!,
          productId: product.id,
          type: MovementType.IN,
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          referenceId: parsed.invoiceNumber,
          notes: `Kulakan Distributor: ${parsed.supplierName} (Faktur: ${parsed.invoiceNumber})`,
          createdById: session.id,
        },
      });
    }

    // 3. Handle Payment (CASH = cut cash flow, DEBT = payable to supplier)
    if (parsed.paymentType === PaymentType.CASH || parsed.paymentType === PaymentType.TRANSFER) {
      await tx.cashFlow.create({
        data: {
          storeId: session.storeId!,
          type: CashFlowType.EXPENSE,
          category: "Kulakan",
          amount: totalAmount,
          description: `Pembelian Stok Distributor: ${parsed.supplierName} (Faktur: ${parsed.invoiceNumber})`,
          referenceId: parsed.invoiceNumber,
          createdById: session.id,
        },
      });
    } else if (parsed.paymentType === PaymentType.DEBT) {
      if (!parsed.dueDate) {
        throw new Error("Tanggal jatuh tempo wajib diisi untuk tagihan faktur supplier.");
      }

      await tx.debtReceivable.create({
        data: {
          storeId: session.storeId!,
          type: DebtType.DEBT, // Hutang Toko ke Supplier
          contactName: parsed.supplierName,
          contactPhone: parsed.supplierPhone || null,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          dueDate: new Date(parsed.dueDate),
          status: DebtStatus.UNPAID,
          notes: `Faktur Pembelian ${parsed.invoiceNumber} - ${parsed.notes || "Kulakan tempo"}`,
        },
      });
    }

    return { totalAmount };
  });

  revalidatePath("/inventory");
  revalidatePath("/purchases");
  revalidatePath("/debts");
  revalidatePath("/cashflow");
  revalidatePath("/dashboard");

  return { success: true, result };
}

export async function getRecentPurchases() {
  const session = await requirePermission("purchases", "view");

  const whereClause: any = { type: MovementType.IN };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  // Retrieve stock in movements linked to purchases scoped to store
  return await prisma.stockMovement.findMany({
    where: whereClause,
    include: {
      product: true,
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
