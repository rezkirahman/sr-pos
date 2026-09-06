import { describe, it, expect } from "vitest";

// Invoice generator helper test
export function generateInvoiceNumber(date: Date, sequence: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(4, "0");
  return `INV-${yyyy}${mm}${dd}-${seq}`;
}

export function calculateCartTotals(
  items: Array<{ quantity: number; sellingPrice: number }>
): { totalAmount: number; totalItems: number } {
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  return { totalAmount, totalItems };
}

export function calculateChange(
  totalAmount: number,
  cashReceived: number
): { change: number; isSufficient: boolean } {
  const change = cashReceived - totalAmount;
  return {
    change: Math.max(0, change),
    isSufficient: change >= 0,
  };
}

describe("POS Kasir Core Logic", () => {
  it("should generate formatted invoice number accurately", () => {
    const testDate = new Date(2026, 8, 6); // 2026-09-06
    const inv = generateInvoiceNumber(testDate, 42);
    expect(inv).toBe("INV-20260906-0042");
  });

  it("should calculate cart subtotal and total quantities accurately", () => {
    const cart = [
      { quantity: 2, sellingPrice: 135000 }, // 270.000
      { quantity: 1, sellingPrice: 625000 }, // 625.000
      { quantity: 4, sellingPrice: 18000 },  // 72.000
    ];
    const { totalAmount, totalItems } = calculateCartTotals(cart);
    expect(totalItems).toBe(7);
    expect(totalAmount).toBe(967000);
  });

  it("should calculate cash change correctly", () => {
    // Exact payment
    const res1 = calculateChange(150000, 150000);
    expect(res1.isSufficient).toBe(true);
    expect(res1.change).toBe(0);

    // Over payment
    const res2 = calculateChange(135000, 150000);
    expect(res2.isSufficient).toBe(true);
    expect(res2.change).toBe(15000);

    // Insufficient payment
    const res3 = calculateChange(150000, 100000);
    expect(res3.isSufficient).toBe(false);
    expect(res3.change).toBe(0);
  });
});
