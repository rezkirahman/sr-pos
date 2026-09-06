import { describe, it, expect } from "vitest";
import { Role } from "@prisma/client";

// Helper function that masks HPP based on user role
export function filterProductDataForRole(
  product: {
    id: string;
    sku: string | null;
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    stock: number;
    minStockAlert: number;
  },
  role: Role
) {
  if (role === Role.CASHIER) {
    const { purchasePrice, ...rest } = product;
    return { ...rest, purchasePrice: null };
  }
  return product;
}

export function isLowStock(stock: number, minAlert: number): boolean {
  return stock <= minAlert && stock > 0;
}

export function isOutOfStock(stock: number): boolean {
  return stock <= 0;
}

export function calculateAdjustmentDiff(
  currentStock: number,
  physicalStock: number
): { diff: number; movementQty: number } {
  const diff = physicalStock - currentStock;
  return {
    diff,
    movementQty: Math.abs(diff),
  };
}

describe("Product & Inventory Business Logic", () => {
  const mockProduct = {
    id: "prod_001",
    sku: "CAT-001",
    name: "Cat Vinilex 5 Kg",
    purchasePrice: 100000,
    sellingPrice: 125000,
    stock: 4,
    minStockAlert: 5,
  };

  it("should mask HPP (purchasePrice) when role is CASHIER", () => {
    const cashierView = filterProductDataForRole(mockProduct, Role.CASHIER);
    expect(cashierView.purchasePrice).toBeNull();
    expect(cashierView.sellingPrice).toBe(125000);
    expect(cashierView.stock).toBe(4);
  });

  it("should expose HPP (purchasePrice) when role is OWNER", () => {
    const ownerView = filterProductDataForRole(mockProduct, Role.OWNER);
    expect(ownerView.purchasePrice).toBe(100000);
    expect(ownerView.sellingPrice).toBe(125000);
  });

  it("should accurately detect low stock and out of stock", () => {
    expect(isLowStock(4, 5)).toBe(true);
    expect(isLowStock(5, 5)).toBe(true);
    expect(isLowStock(6, 5)).toBe(false);
    expect(isLowStock(0, 5)).toBe(false); // Out of stock, not low stock
    expect(isOutOfStock(0)).toBe(true);
    expect(isOutOfStock(-1)).toBe(true);
    expect(isOutOfStock(1)).toBe(false);
  });

  it("should calculate stock adjustment difference and absolute quantity", () => {
    // Current stock: 10, Physical stock found: 8 (decrease 2)
    const adj1 = calculateAdjustmentDiff(10, 8);
    expect(adj1.diff).toBe(-2);
    expect(adj1.movementQty).toBe(2);

    // Current stock: 5, Physical stock found: 9 (increase 4)
    const adj2 = calculateAdjustmentDiff(5, 9);
    expect(adj2.diff).toBe(4);
    expect(adj2.movementQty).toBe(4);
  });
});
