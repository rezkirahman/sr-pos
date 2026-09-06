import { describe, it, expect } from "vitest";

export function calculatePurchaseTotal(
  items: Array<{ quantity: number; purchasePrice: number }>
): number {
  return items.reduce((sum, i) => sum + i.quantity * i.purchasePrice, 0);
}

export function calculateNewStockAndHPP(
  currentStock: number,
  addedStock: number,
  newPurchasePrice: number
): { newStock: number; updatedHPP: number } {
  return {
    newStock: currentStock + addedStock,
    updatedHPP: newPurchasePrice,
  };
}

describe("Supplier Purchase (Kulakan) Business Logic", () => {
  it("should calculate total purchase bill accurately", () => {
    const items = [
      { quantity: 10, purchasePrice: 110000 }, // 1.100.000
      { quantity: 5, purchasePrice: 520000 },  // 2.600.000
      { quantity: 20, purchasePrice: 53000 },  // 1.060.000
    ];
    const total = calculatePurchaseTotal(items);
    expect(total).toBe(4760000);
  });

  it("should correctly update stock and HPP after supplier purchase", () => {
    // Current stock 8, buying 12 cans at new price 115000 (was 110000)
    const res = calculateNewStockAndHPP(8, 12, 115000);
    expect(res.newStock).toBe(20);
    expect(res.updatedHPP).toBe(115000);
  });
});
