import { describe, it, expect } from "vitest";

export function calculateNetCashFlow(totalIncome: number, totalExpense: number): number {
  return totalIncome - totalExpense;
}

export function calculateGrossProfit(
  transactionItems: Array<{ quantity: number; unitPrice: number; costPriceSnapshot: number }>
): number {
  return transactionItems.reduce((sum, item) => {
    const revenue = item.quantity * item.unitPrice;
    const cost = item.quantity * item.costPriceSnapshot;
    return sum + (revenue - cost);
  }, 0);
}

describe("Cash Flow & Profit Business Calculations", () => {
  it("should calculate Net Cash Flow accurately", () => {
    const income = 15500000;  // 15.5 jt
    const expense = 9200000;  // 9.2 jt
    const net = calculateNetCashFlow(income, expense);
    expect(net).toBe(6300000); // 6.3 jt
  });

  it("should calculate Gross Profit accurately based on costPriceSnapshot", () => {
    const items = [
      // Sold 2 cans Vinilex: Sell 135.000, Modal 110.000 -> Profit 25.000 x 2 = 50.000
      { quantity: 2, unitPrice: 135000, costPriceSnapshot: 110000 },
      // Sold 1 pail: Sell 625.000, Modal 520.000 -> Profit 105.000 x 1 = 105.000
      { quantity: 1, unitPrice: 625000, costPriceSnapshot: 520000 },
      // Sold 5 sacks cement: Sell 61.000, Modal 53.000 -> Profit 8.000 x 5 = 40.000
      { quantity: 5, unitPrice: 61000, costPriceSnapshot: 53000 },
    ];

    const grossProfit = calculateGrossProfit(items);
    // 50.000 + 105.000 + 40.000 = 195.000
    expect(grossProfit).toBe(195000);
  });
});
