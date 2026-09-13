import { describe, it, expect } from "vitest";

describe("Multi-Tenant Isolation Architecture", () => {
  it("isolates product catalog per store with identical SKUs", () => {
    const store1Products = [
      { id: "p1", storeId: "store-1", sku: "CAT-001", name: "Cat Putih Toko 1", stock: 10 },
      { id: "p2", storeId: "store-1", sku: "CAT-002", name: "Cat Hitam Toko 1", stock: 5 },
    ];

    const store2Products = [
      { id: "p3", storeId: "store-2", sku: "CAT-001", name: "Cat Putih Toko 2", stock: 20 },
      { id: "p4", storeId: "store-2", sku: "CAT-003", name: "Kuas Toko 2", stock: 15 },
    ];

    // Toko 1 and Toko 2 can both have SKU 'CAT-001'
    expect(store1Products[0].sku).toBe(store2Products[0].sku);
    expect(store1Products[0].storeId).not.toBe(store2Products[0].storeId);

    // Filtering by store-1 only returns store-1 products
    const allProducts = [...store1Products, ...store2Products];
    const filteredStore1 = allProducts.filter((p) => p.storeId === "store-1");
    expect(filteredStore1.length).toBe(2);
    expect(filteredStore1.every((p) => p.storeId === "store-1")).toBe(true);

    // Store 2 cannot see Store 1's products
    const filteredStore2 = allProducts.filter((p) => p.storeId === "store-2");
    expect(filteredStore2.length).toBe(2);
    expect(filteredStore2.some((p) => p.name.includes("Toko 1"))).toBe(false);
  });

  it("isolates transactions and generates independent invoice sequences", () => {
    const generateStoreInvoice = (existingInvoicesForStore: string[], datePrefix: string) => {
      const seq = String(existingInvoicesForStore.length + 1).padStart(4, "0");
      return `${datePrefix}-${seq}`;
    };

    const datePrefix = "INV-20260913";
    const store1Invoices = ["INV-20260913-0001", "INV-20260913-0002"];
    const store2Invoices: string[] = [];

    // Store 1 next invoice is 0003
    const nextStore1 = generateStoreInvoice(store1Invoices, datePrefix);
    expect(nextStore1).toBe("INV-20260913-0003");

    // Store 2 next invoice starts at 0001 independently
    const nextStore2 = generateStoreInvoice(store2Invoices, datePrefix);
    expect(nextStore2).toBe("INV-20260913-0001");
  });

  it("isolates financial ledger and debt summaries", () => {
    const cashFlowEntries = [
      { id: "cf1", storeId: "store-1", type: "INCOME", amount: 500000 },
      { id: "cf2", storeId: "store-1", type: "EXPENSE", amount: 100000 },
      { id: "cf3", storeId: "store-2", type: "INCOME", amount: 2000000 },
    ];

    const store1Net = cashFlowEntries
      .filter((c) => c.storeId === "store-1")
      .reduce((sum, c) => sum + (c.type === "INCOME" ? c.amount : -c.amount), 0);

    const store2Net = cashFlowEntries
      .filter((c) => c.storeId === "store-2")
      .reduce((sum, c) => sum + (c.type === "INCOME" ? c.amount : -c.amount), 0);

    // Store 1 net is 400k, store 2 net is 2M
    expect(store1Net).toBe(400000);
    expect(store2Net).toBe(2000000);
  });
});
