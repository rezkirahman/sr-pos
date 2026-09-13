"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { checkoutSchema, CheckoutInput } from "@/lib/validations/pos";
import { PaymentType, MovementType, DebtType, DebtStatus, CashFlowType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function checkoutTransaction(input: CheckoutInput) {
  const session = await requirePermission("pos", "create");
  if (!session.storeId) {
    throw new Error("Akun Super Admin tidak terikat toko untuk transaksi kasir.");
  }

  const parsed = checkoutSchema.parse(input);

  // Perform ACID transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch & Validate stock availability (scoped to store)
    const productIds = parsed.items.map((i) => i.productId);
    const dbProducts = await tx.product.findMany({
      where: { id: { in: productIds }, storeId: session.storeId! },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of parsed.items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        throw new Error(`Barang "${item.name}" tidak ditemukan di database toko Anda`);
      }
      if (dbProd.stock < item.quantity) {
        throw new Error(
          `Stok "${dbProd.name}" tidak mencukupi. Tersedia: ${dbProd.stock} ${dbProd.unit}, diminta: ${item.quantity} ${dbProd.unit}`
        );
      }
    }

    // 2. Generate Invoice Number per Store: INV-YYYYMMDD-XXXX
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePrefix = `INV-${yyyy}${mm}${dd}`;

    const todayCount = await tx.transaction.count({
      where: {
        storeId: session.storeId!,
        invoiceNumber: {
          startsWith: datePrefix,
        },
      },
    });

    const seq = String(todayCount + 1).padStart(4, "0");
    const invoiceNumber = `${datePrefix}-${seq}`;

    // 3. Calculate total amount
    const totalAmount = parsed.items.reduce(
      (sum, item) => sum + item.quantity * item.sellingPrice,
      0
    );

    let changeAmount = 0;
    if (parsed.paymentType === PaymentType.CASH) {
      if (parsed.cashReceived === undefined || parsed.cashReceived === null || parsed.cashReceived < totalAmount) {
        throw new Error(
          `Nominal uang tunai (${parsed.cashReceived || 0}) kurang dari total transaksi (${totalAmount}).`
        );
      }
      changeAmount = parsed.cashReceived - totalAmount;
    }

    // 4. Create Transaction Record
    const transaction = await tx.transaction.create({
      data: {
        storeId: session.storeId!,
        invoiceNumber,
        customerName: parsed.customerName || null,
        paymentType: parsed.paymentType,
        totalAmount,
        cashReceived: parsed.cashReceived || null,
        changeAmount,
        createdById: session.id,
        items: {
          create: parsed.items.map((item) => {
            const dbProd = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.sellingPrice,
              costPriceSnapshot: dbProd.purchasePrice, // Snapshot HPP
              subtotal: item.quantity * item.sellingPrice,
            };
          }),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // 5. Decrement Stock & Record OUT StockMovements
    for (const item of parsed.items) {
      const dbProd = productMap.get(item.productId)!;
      const newStock = dbProd.stock - item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          storeId: session.storeId!,
          productId: item.productId,
          type: MovementType.OUT,
          quantity: item.quantity,
          stockBefore: dbProd.stock,
          stockAfter: newStock,
          referenceId: invoiceNumber,
          notes: `Penjualan Kasir (${invoiceNumber}) - Pelanggan: ${parsed.customerName || "Umum"}`,
          createdById: session.id,
        },
      });
    }

    // 6. Payment Handling
    if (parsed.paymentType === PaymentType.CASH || parsed.paymentType === PaymentType.TRANSFER) {
      // Record CashFlow INCOME
      await tx.cashFlow.create({
        data: {
          storeId: session.storeId!,
          type: CashFlowType.INCOME,
          category: "Penjualan",
          amount: totalAmount,
          description: `Penjualan Kasir Nota ${invoiceNumber} (${parsed.paymentType})`,
          referenceId: invoiceNumber,
          createdById: session.id,
        },
      });
    } else if (parsed.paymentType === PaymentType.DEBT) {
      // Record DebtReceivable (Bon Pelanggan)
      if (!parsed.dueDate) {
        throw new Error("Tanggal jatuh tempo wajib ditentukan untuk pembayaran Bon");
      }

      await tx.debtReceivable.create({
        data: {
          storeId: session.storeId!,
          type: DebtType.RECEIVABLE,
          contactName: parsed.customerName!,
          contactPhone: parsed.customerPhone || null,
          transactionId: transaction.id,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          dueDate: new Date(parsed.dueDate),
          status: DebtStatus.UNPAID,
          notes: parsed.notes || `Bon transaksi kasir nota ${invoiceNumber}`,
        },
      });
    }

    return transaction;
  });

  revalidatePath("/pos");
  revalidatePath("/inventory");
  revalidatePath("/debts");
  revalidatePath("/cashflow");
  revalidatePath("/dashboard");

  return {
    success: true,
    transaction: result,
  };
}
