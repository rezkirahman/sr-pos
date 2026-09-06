import { describe, it, expect } from "vitest";
import { Role, DebtStatus } from "@prisma/client";
import { calculateCartTotals, calculateChange } from "../unit/pos-transaction.test";
import { getDueDateStatus } from "@/lib/due-date";
import { calculateGrossProfit, calculateNetCashFlow } from "../unit/cashflow.test";
import { filterProductDataForRole } from "../unit/product-service.test";

describe("Integration: Full End-to-End Retail & Cashier Lifecycle", () => {
  it("executes the full store operation cycle accurately", () => {
    // 1. Initial State: Owner creates product
    const product = {
      id: "prod_vinilex_5k",
      sku: "CAT-VNLX-005",
      name: "Cat Tembok Vinilex 5 Kg Brilliant White",
      category: "Cat Tembok",
      unit: "Galon",
      purchasePrice: 110000, // HPP modal
      sellingPrice: 135000,  // Harga jual eceran
      stock: 10,
      minStockAlert: 5,
    };

    // 2. Cashier views catalog (HPP is masked)
    const cashierView = filterProductDataForRole(product, Role.CASHIER);
    expect(cashierView.purchasePrice).toBeNull();
    expect(cashierView.sellingPrice).toBe(135000);

    // 3. Cashier POS Transaction 1: Customer buys 2 cans with Cash
    const cartSale1 = [{ quantity: 2, sellingPrice: product.sellingPrice }];
    const totals1 = calculateCartTotals(cartSale1);
    expect(totals1.totalAmount).toBe(270000);

    const cashReceived = 300000;
    const changeResult = calculateChange(totals1.totalAmount, cashReceived);
    expect(changeResult.isSufficient).toBe(true);
    expect(changeResult.change).toBe(30000);

    // Stock decreases by 2 -> stock is now 8
    let currentStock = product.stock - 2;
    expect(currentStock).toBe(8);

    // 4. Cashier POS Transaction 2: Contractor buys 4 cans via Bon (Tempo)
    const cartSale2 = [{ quantity: 4, sellingPrice: product.sellingPrice }];
    const totals2 = calculateCartTotals(cartSale2);
    expect(totals2.totalAmount).toBe(540000);

    // Stock decreases by 4 -> stock is now 4 (Below minStockAlert = 5!)
    currentStock -= 4;
    expect(currentStock).toBe(4);
    expect(currentStock <= product.minStockAlert).toBe(true); // Low stock alert triggered!

    // Debt record created for contractor
    const today = new Date(2026, 8, 6);
    const dueDate = new Date(2026, 8, 20); // 14 days later
    let debtRecord = {
      totalAmount: totals2.totalAmount,
      paidAmount: 0,
      remainingAmount: totals2.totalAmount,
      dueDate,
      status: DebtStatus.UNPAID,
    };

    // Verify initial debt reminder status (Safe, 14 days ahead)
    const dueStatus1 = getDueDateStatus(debtRecord.dueDate, false, today);
    expect(dueStatus1.status).toBe("SAFE");
    expect(dueStatus1.daysDiff).toBe(14);

    // Fast forward time to 1 day before due date (2026-09-19)
    const reminderDate = new Date(2026, 8, 19);
    const dueStatus2 = getDueDateStatus(debtRecord.dueDate, false, reminderDate);
    expect(dueStatus2.status).toBe("APPROACHING"); // Yellow warning badge

    // 5. Contractor pays partial installment of 300.000
    const installmentPaid = 300000;
    debtRecord.paidAmount += installmentPaid;
    debtRecord.remainingAmount -= installmentPaid;
    debtRecord.status = DebtStatus.PARTIAL;

    expect(debtRecord.remainingAmount).toBe(240000);
    expect(debtRecord.status).toBe(DebtStatus.PARTIAL);

    // 6. Cash Flow calculations
    // Cash In: Cash sale 1 (270.000) + Installment (300.000) = 570.000
    const totalCashIncome = totals1.totalAmount + installmentPaid;
    // Cash Out: Operational expense (Listrik 150.000)
    const totalCashExpense = 150000;
    const netCash = calculateNetCashFlow(totalCashIncome, totalCashExpense);
    expect(netCash).toBe(420000);

    // 7. Gross Profit calculation: Total 6 cans sold (2 cash + 4 tempo)
    // Revenue: 6 x 135.000 = 810.000
    // HPP Cost: 6 x 110.000 = 660.000
    // Gross Profit: 810.000 - 660.000 = 150.000
    const soldItems = [
      { quantity: 2, unitPrice: product.sellingPrice, costPriceSnapshot: product.purchasePrice },
      { quantity: 4, unitPrice: product.sellingPrice, costPriceSnapshot: product.purchasePrice },
    ];
    const totalGrossProfit = calculateGrossProfit(soldItems);
    expect(totalGrossProfit).toBe(150000);
  });
});
