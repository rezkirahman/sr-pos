"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { DebtType, DebtStatus, CashFlowType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getDebtsSummary() {
  const session = await requirePermission("debts", "view");

  const whereClause: any = {
    status: { in: [DebtStatus.UNPAID, DebtStatus.PARTIAL] },
  };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  const allUnpaid = await prisma.debtReceivable.findMany({
    where: whereClause,
  });

  const totalReceivables = allUnpaid
    .filter((d) => d.type === DebtType.RECEIVABLE)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalPayables = allUnpaid
    .filter((d) => d.type === DebtType.DEBT)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  // Critical due count: due date <= today
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const criticalCount = allUnpaid.filter(
    (d) => new Date(d.dueDate) <= todayEnd
  ).length;

  return {
    totalReceivables,
    totalPayables,
    criticalCount,
  };
}

export async function getDebts(type: DebtType) {
  const session = await requirePermission("debts", "view");

  const whereClause: any = { type };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  return await prisma.debtReceivable.findMany({
    where: whereClause,
    include: {
      transaction: true,
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
    orderBy: [
      { status: "asc" }, // UNPAID & PARTIAL first
      { dueDate: "asc" }, // Closest deadline first
    ],
  });
}

export async function recordDebtPayment(
  debtId: string,
  amount: number,
  paymentMethod: string = "Tunai",
  notes?: string
) {
  const session = await requirePermission("debts", "update");

  if (amount <= 0) {
    throw new Error("Nominal pembayaran harus lebih dari 0.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const whereClause: any = { id: debtId };
    if (session.storeId) {
      whereClause.storeId = session.storeId;
    }

    const debt = await tx.debtReceivable.findFirst({
      where: whereClause,
    });

    if (!debt) {
      throw new Error("Data tagihan tidak ditemukan di toko ini.");
    }

    if (amount > debt.remainingAmount) {
      throw new Error(
        `Nominal bayar (${amount}) melebihi sisa tagihan (${debt.remainingAmount}).`
      );
    }

    const newPaidAmount = debt.paidAmount + amount;
    const newRemainingAmount = debt.remainingAmount - amount;
    const newStatus =
      newRemainingAmount === 0 ? DebtStatus.PAID : DebtStatus.PARTIAL;

    // 1. Record DebtPayment
    await tx.debtPayment.create({
      data: {
        debtReceivableId: debt.id,
        amount,
        paymentMethod,
        notes: notes || null,
      },
    });

    // 2. Update DebtReceivable
    const updatedDebt = await tx.debtReceivable.update({
      where: { id: debt.id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
      },
    });

    // 3. CashFlow Entry
    if (debt.type === DebtType.RECEIVABLE) {
      // Toko menerima uang kas (INCOME)
      await tx.cashFlow.create({
        data: {
          storeId: debt.storeId,
          type: CashFlowType.INCOME,
          category: "Pelunasan Piutang",
          amount,
          description: `Cicilan Piutang: ${debt.contactName} (${paymentMethod})`,
          referenceId: debt.id,
          createdById: session.id,
        },
      });
    } else {
      // Toko membayar uang keluar ke supplier (EXPENSE)
      await tx.cashFlow.create({
        data: {
          storeId: debt.storeId,
          type: CashFlowType.EXPENSE,
          category: "Bayar Hutang Supplier",
          amount,
          description: `Pembayaran Hutang Distributor: ${debt.contactName} (${paymentMethod})`,
          referenceId: debt.id,
          createdById: session.id,
        },
      });
    }

    return updatedDebt;
  });

  revalidatePath("/debts");
  revalidatePath("/cashflow");
  revalidatePath("/dashboard");

  return { success: true, debt: result };
}
