"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { expenseSchema, ExpenseInput } from "@/lib/validations/cashflow";
import { Role, CashFlowType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createExpense(input: ExpenseInput) {
  const session = await requireRole([Role.OWNER]);
  const parsed = expenseSchema.parse(input);

  const expenseDate = new Date(parsed.expenseDate);

  const created = await prisma.cashFlow.create({
    data: {
      storeId: session.storeId,
      type: CashFlowType.EXPENSE,
      category: parsed.category,
      amount: parsed.amount,
      description: parsed.description,
      createdAt: expenseDate,
      createdById: session.id,
    },
  });

  revalidatePath("/cashflow");
  revalidatePath("/dashboard");

  return { success: true, expense: created };
}

export async function getCashFlowLedger(startDate?: string, endDate?: string) {
  const session = await requireRole([Role.OWNER]);

  const whereClause: any = {
    storeId: session.storeId,
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = end;
    }
  }

  return await prisma.cashFlow.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getCashFlowSummary(startDate?: string, endDate?: string) {
  const session = await requireRole([Role.OWNER]);

  const dateFilter: any = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const hasDateFilter = startDate || endDate;

  // 1. Fetch cash flow entries scoped to store
  const cashFlows = await prisma.cashFlow.findMany({
    where: {
      storeId: session.storeId,
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    },
  });

  const totalIncome = cashFlows
    .filter((c) => c.type === CashFlowType.INCOME)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalExpense = cashFlows
    .filter((c) => c.type === CashFlowType.EXPENSE)
    .reduce((sum, c) => sum + c.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  // 2. Calculate Gross Profit from TransactionItems scoped to store (Sell Price - HPP Snapshot)
  const transactionItems = await prisma.transactionItem.findMany({
    where: {
      transaction: {
        storeId: session.storeId,
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
      },
    },
    select: {
      quantity: true,
      unitPrice: true,
      costPriceSnapshot: true,
    },
  });

  const grossProfit = transactionItems.reduce((sum, item) => {
    const revenue = item.quantity * item.unitPrice;
    const cost = item.quantity * item.costPriceSnapshot;
    return sum + (revenue - cost);
  }, 0);

  return {
    totalIncome,
    totalExpense,
    netCashFlow,
    grossProfit,
  };
}
