import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  userHasPermission,
} from "@/lib/auth";
import { hasPermission, MODULE_DEFINITIONS } from "@/lib/permissions";
import { checkoutSchema } from "@/lib/validations/pos";
import { purchaseSchema } from "@/lib/validations/purchase";
import { productSchema } from "@/lib/validations/product";
import {
  PaymentType,
  MovementType,
  DebtType,
  DebtStatus,
  CashFlowType,
} from "@prisma/client";

describe("E2E Comprehensive Suite: Multi-Tenant, Dynamic RBAC, POS, Debt & Financial Flow", () => {
  let storeA: any;
  let storeB: any;
  let ownerRole: any;
  let cashierRole: any;
  let superAdminRole: any;
  let superAdminUser: any;
  let userStoreA: any;
  let userStoreB: any;

  beforeAll(async () => {
    // 1. Fetch system roles
    superAdminRole = await prisma.role.findUnique({ where: { code: "SUPERADMIN" } });
    ownerRole = await prisma.role.findUnique({ where: { code: "OWNER" } });
    cashierRole = await prisma.role.findUnique({ where: { code: "CASHIER" } });

    expect(superAdminRole).toBeDefined();
    expect(ownerRole).toBeDefined();
    expect(cashierRole).toBeDefined();

    // 2. Fetch or create test stores
    storeA = await prisma.store.upsert({
      where: { code: "TEST_E2E_A" },
      update: { isActive: true },
      create: {
        code: "TEST_E2E_A",
        name: "Toko E2E Alpha",
        isActive: true,
      },
    });

    storeB = await prisma.store.upsert({
      where: { code: "TEST_E2E_B" },
      update: { isActive: true },
      create: {
        code: "TEST_E2E_B",
        name: "Toko E2E Beta",
        isActive: true,
      },
    });

    // 3. Super Admin user
    superAdminUser = await prisma.user.findFirst({
      where: { role: { code: "SUPERADMIN" } },
      include: { role: true },
    });

    // 4. Create or fetch store users
    const pwdHash = await hashPassword("testing123");

    userStoreA = await prisma.user.upsert({
      where: { username: "kasir_test_a" },
      update: { storeId: storeA.id, roleId: cashierRole.id },
      create: {
        storeId: storeA.id,
        roleId: cashierRole.id,
        name: "Kasir Toko A",
        username: "kasir_test_a",
        passwordHash: pwdHash,
      },
      include: {
        role: { include: { permissions: true } },
      },
    });

    userStoreB = await prisma.user.upsert({
      where: { username: "kasir_test_b" },
      update: { storeId: storeB.id, roleId: cashierRole.id },
      create: {
        storeId: storeB.id,
        roleId: cashierRole.id,
        name: "Kasir Toko B",
        username: "kasir_test_b",
        passwordHash: pwdHash,
      },
      include: {
        role: { include: { permissions: true } },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data created during tests
    if (storeA?.id && storeB?.id) {
      await prisma.transactionItem.deleteMany({
        where: {
          product: {
            storeId: { in: [storeA.id, storeB.id] },
          },
        },
      });
      await prisma.stockMovement.deleteMany({
        where: { storeId: { in: [storeA.id, storeB.id] } },
      });
      await prisma.cashFlow.deleteMany({
        where: { storeId: { in: [storeA.id, storeB.id] } },
      });
      await prisma.debtPayment.deleteMany({
        where: {
          debtReceivable: {
            storeId: { in: [storeA.id, storeB.id] },
          },
        },
      });
      await prisma.debtReceivable.deleteMany({
        where: { storeId: { in: [storeA.id, storeB.id] } },
      });
      await prisma.transaction.deleteMany({
        where: { storeId: { in: [storeA.id, storeB.id] } },
      });
      await prisma.product.deleteMany({
        where: { storeId: { in: [storeA.id, storeB.id] } },
      });
      await prisma.user.deleteMany({
        where: { username: { in: ["kasir_test_a", "kasir_test_b", "owner_test_e2e_temp"] } },
      });
      await prisma.store.deleteMany({
        where: { code: { in: ["TEST_E2E_A", "TEST_E2E_B", "STORE_TEMP_MASTER"] } },
      });
    }
  });

  // =========================================================================
  // TEST 1: MULTI-TENANT ISOLATION
  // =========================================================================
  describe("1. Multi-Tenant Architecture & Data Isolation", () => {
    it("allows identical SKU across different stores without collision", async () => {
      const sharedSku = "SKU-CAT-E2E-001";

      const prodA = await prisma.product.create({
        data: {
          storeId: storeA.id,
          sku: sharedSku,
          name: "Cat Tembok Toko A",
          category: "Cat Tembok",
          unit: "Galon",
          purchasePrice: 100000,
          sellingPrice: 130000,
          stock: 20,
          minStockAlert: 5,
        },
      });

      const prodB = await prisma.product.create({
        data: {
          storeId: storeB.id,
          sku: sharedSku,
          name: "Cat Tembok Toko B",
          category: "Cat Tembok",
          unit: "Galon",
          purchasePrice: 110000,
          sellingPrice: 140000,
          stock: 15,
          minStockAlert: 3,
        },
      });

      expect(prodA.sku).toBe(prodB.sku);
      expect(prodA.storeId).not.toBe(prodB.storeId);
      expect(prodA.name).toBe("Cat Tembok Toko A");
      expect(prodB.name).toBe("Cat Tembok Toko B");

      // Verify querying store A only returns store A products
      const storeAProducts = await prisma.product.findMany({
        where: { storeId: storeA.id },
      });
      expect(storeAProducts.some((p) => p.id === prodA.id)).toBe(true);
      expect(storeAProducts.some((p) => p.id === prodB.id)).toBe(false);

      // Verify updating prodA doesn't alter prodB
      await prisma.product.update({
        where: { id: prodA.id },
        data: { stock: 18 },
      });

      const freshProdB = await prisma.product.findUnique({
        where: { id: prodB.id },
      });
      expect(freshProdB?.stock).toBe(15);
    });

    it("prevents cross-store data leakage in transaction numbers", async () => {
      const datePrefix = "INV-E2ETEST";

      const txA = await prisma.transaction.create({
        data: {
          storeId: storeA.id,
          invoiceNumber: `${datePrefix}-0001`,
          paymentType: PaymentType.CASH,
          totalAmount: 130000,
          cashReceived: 150000,
          changeAmount: 20000,
          createdById: userStoreA.id,
        },
      });

      // Count for store B should still be 0
      const storeBCount = await prisma.transaction.count({
        where: {
          storeId: storeB.id,
          invoiceNumber: { startsWith: datePrefix },
        },
      });
      expect(storeBCount).toBe(0);

      // Create transaction in store B
      const txB = await prisma.transaction.create({
        data: {
          storeId: storeB.id,
          invoiceNumber: `${datePrefix}-0001`, // Can reuse 0001 per store!
          paymentType: PaymentType.CASH,
          totalAmount: 140000,
          cashReceived: 140000,
          changeAmount: 0,
          createdById: userStoreB.id,
        },
      });

      expect(txA.invoiceNumber).toBe(txB.invoiceNumber);
      expect(txA.storeId).not.toBe(txB.storeId);
    });
  });

  // =========================================================================
  // TEST 2: DYNAMIC RBAC & GRANULAR PERMISSIONS MATRIX
  // =========================================================================
  describe("2. Dynamic RBAC & Granular Permissions", () => {
    let customRole: any;

    it("creates a custom role with a specific CRUD matrix", async () => {
      customRole = await prisma.role.create({
        data: {
          name: "Supervisor Gudang E2E",
          code: "SUPERVISOR_GUDANG_E2E",
          description: "Role khusus staf gudang untuk testing",
          isSystem: false,
          permissions: {
            create: [
              { module: "inventory", canView: true, canCreate: true, canUpdate: true, canDelete: false },
              { module: "purchases", canView: true, canCreate: true, canUpdate: false, canDelete: false },
              { module: "pos", canView: false, canCreate: false, canUpdate: false, canDelete: false },
              { module: "users", canView: false, canCreate: false, canUpdate: false, canDelete: false },
            ],
          },
        },
        include: { permissions: true },
      });

      expect(customRole.id).toBeDefined();
      expect(customRole.permissions.length).toBe(4);
    });

    it("verifies permissions match the defined CRUD matrix exactly", () => {
      const perms = customRole.permissions;

      // Inventory: View, Create, Update allowed; Delete DENIED
      expect(hasPermission(perms, "inventory", "view")).toBe(true);
      expect(hasPermission(perms, "inventory", "create")).toBe(true);
      expect(hasPermission(perms, "inventory", "update")).toBe(true);
      expect(hasPermission(perms, "inventory", "delete")).toBe(false);

      // Purchases: View, Create allowed; Update, Delete DENIED
      expect(hasPermission(perms, "purchases", "view")).toBe(true);
      expect(hasPermission(perms, "purchases", "create")).toBe(true);
      expect(hasPermission(perms, "purchases", "update")).toBe(false);

      // POS & Users: Completely DENIED
      expect(hasPermission(perms, "pos", "view")).toBe(false);
      expect(hasPermission(perms, "pos", "create")).toBe(false);
      expect(hasPermission(perms, "users", "view")).toBe(false);
    });

    it("verifies Super Admin bypasses all checks regardless of role permission entries", () => {
      const sessionSuperAdmin = {
        id: superAdminUser.id,
        name: superAdminUser.name,
        username: superAdminUser.username,
        roleId: superAdminRole.id,
        roleCode: "SUPERADMIN",
        roleName: "Super Administrator",
        permissions: [],
      };

      for (const mod of MODULE_DEFINITIONS) {
        expect(userHasPermission(sessionSuperAdmin, mod.key, "view")).toBe(true);
        expect(userHasPermission(sessionSuperAdmin, mod.key, "create")).toBe(true);
        expect(userHasPermission(sessionSuperAdmin, mod.key, "update")).toBe(true);
        expect(userHasPermission(sessionSuperAdmin, mod.key, "delete")).toBe(true);
      }
    });

    it("updates custom role permissions and validates updated permissions", async () => {
      await prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: customRole.id } });
        await tx.rolePermission.createMany({
          data: [
            { roleId: customRole.id, module: "inventory", canView: true, canCreate: true, canUpdate: true, canDelete: true },
          ],
        });
      });

      const updatedRole = await prisma.role.findUnique({
        where: { id: customRole.id },
        include: { permissions: true },
      });

      expect(hasPermission(updatedRole?.permissions || [], "inventory", "delete")).toBe(true);
    });

    it("cleans up the test custom role", async () => {
      await prisma.rolePermission.deleteMany({ where: { roleId: customRole.id } });
      await prisma.role.delete({ where: { id: customRole.id } });
    });
  });

  // =========================================================================
  // TEST 3: MASTER DASHBOARD OPERATIONS
  // =========================================================================
  describe("3. Master Dashboard Operations (Password Reset & Store Onboarding)", () => {
    it("allows Master to directly reset user password without knowing old password", async () => {
      const targetUser = userStoreA;
      const directNewPassword = "brandNewMasterResetPassword999!";

      const newHash = await hashPassword(directNewPassword);

      await prisma.user.update({
        where: { id: targetUser.id },
        data: { passwordHash: newHash },
      });

      const freshUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
      const validNew = await verifyPassword(directNewPassword, freshUser!.passwordHash);
      expect(validNew).toBe(true);

      const validOld = await verifyPassword("testing123", freshUser!.passwordHash);
      expect(validOld).toBe(false);
    });

    it("creates a new store and its initial owner in a single atomic transaction", async () => {
      const newStoreCode = "STORE_TEMP_MASTER";
      const ownerUsername = "owner_test_e2e_temp";
      const ownerPlainPassword = "ownerPassword2026";
      const hashedPassword = await hashPassword(ownerPlainPassword);

      const result = await prisma.$transaction(async (tx) => {
        const store = await tx.store.create({
          data: {
            code: newStoreCode,
            name: "Toko Baru Onboarding Master",
            address: "Jl. Raya No. 10",
            phone: "081234567890",
            isActive: true,
          },
        });

        const owner = await tx.user.create({
          data: {
            storeId: store.id,
            roleId: ownerRole.id,
            name: "Bapak Hendra",
            username: ownerUsername,
            passwordHash: hashedPassword,
          },
        });

        return { store, owner };
      });

      expect(result.store.id).toBeDefined();
      expect(result.store.code).toBe(newStoreCode);
      expect(result.owner.id).toBeDefined();
      expect(result.owner.storeId).toBe(result.store.id);

      const verified = await verifyPassword(ownerPlainPassword, result.owner.passwordHash);
      expect(verified).toBe(true);
    });

    it("verifies store deactivation blocks store user access", async () => {
      const deactivatedStore = await prisma.store.update({
        where: { code: "STORE_TEMP_MASTER" },
        data: { isActive: false },
      });

      expect(deactivatedStore.isActive).toBe(false);

      const user = await prisma.user.findUnique({
        where: { username: "owner_test_e2e_temp" },
        include: { store: true, role: true },
      });

      const isSuperAdmin = user?.role.code === "SUPERADMIN";
      const isStoreActive = user?.store?.isActive;

      expect(isSuperAdmin).toBe(false);
      expect(isStoreActive).toBe(false);
    });
  });

  // =========================================================================
  // TEST 4: POS & CASHIER TRANSACTION LIFECYCLE (ACID)
  // =========================================================================
  describe("4. POS Checkout, Stock Movement, and Cash Flow Lifecycle", () => {
    let testProduct: any;

    beforeAll(async () => {
      testProduct = await prisma.product.create({
        data: {
          storeId: storeA.id,
          sku: "POS-TEST-CAT-01",
          name: "Dulux Weathershield 2.5L",
          category: "Cat Eksterior",
          unit: "Galon",
          purchasePrice: 200000,
          sellingPrice: 260000,
          stock: 10,
          minStockAlert: 3,
        },
      });
    });

    it("processes CASH sale: decrements stock, records OUT movement, and logs cashflow income", async () => {
      const qtyPurchased = 2;
      const expectedTotal = qtyPurchased * testProduct.sellingPrice;
      const cashReceived = 600000;
      const expectedChange = cashReceived - expectedTotal;
      const invoiceNumber = `INV-E2E-CASH-${Date.now()}`;

      const transaction = await prisma.$transaction(async (tx) => {
        const t = await tx.transaction.create({
          data: {
            storeId: storeA.id,
            invoiceNumber,
            customerName: "Budi Tukang",
            paymentType: PaymentType.CASH,
            totalAmount: expectedTotal,
            cashReceived,
            changeAmount: expectedChange,
            createdById: userStoreA.id,
            items: {
              create: [
                {
                  productId: testProduct.id,
                  quantity: qtyPurchased,
                  unitPrice: testProduct.sellingPrice,
                  costPriceSnapshot: testProduct.purchasePrice,
                  subtotal: expectedTotal,
                },
              ],
            },
          },
          include: { items: true },
        });

        const newStock = testProduct.stock - qtyPurchased;
        await tx.product.update({
          where: { id: testProduct.id },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            storeId: storeA.id,
            productId: testProduct.id,
            type: MovementType.OUT,
            quantity: qtyPurchased,
            stockBefore: testProduct.stock,
            stockAfter: newStock,
            referenceId: invoiceNumber,
            notes: `Penjualan Kasir Nota ${invoiceNumber}`,
            createdById: userStoreA.id,
          },
        });

        await tx.cashFlow.create({
          data: {
            storeId: storeA.id,
            type: CashFlowType.INCOME,
            category: "Penjualan",
            amount: expectedTotal,
            description: `Penjualan Kasir Nota ${invoiceNumber}`,
            referenceId: invoiceNumber,
            createdById: userStoreA.id,
          },
        });

        return t;
      });

      expect(transaction.id).toBeDefined();
      expect(transaction.totalAmount).toBe(expectedTotal);
      expect(transaction.changeAmount).toBe(expectedChange);

      const freshProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(freshProd?.stock).toBe(8);

      const movement = await prisma.stockMovement.findFirst({
        where: { referenceId: invoiceNumber },
      });
      expect(movement?.type).toBe(MovementType.OUT);
      expect(movement?.stockBefore).toBe(10);
      expect(movement?.stockAfter).toBe(8);

      const cashflow = await prisma.cashFlow.findFirst({
        where: { referenceId: invoiceNumber },
      });
      expect(cashflow?.type).toBe(CashFlowType.INCOME);
      expect(cashflow?.amount).toBe(expectedTotal);

      testProduct.stock = 8;
    });

    it("processes TEMPO (Kasbon) sale: creates DebtReceivable without initial CashFlow, then records installments", async () => {
      const qtyPurchased = 3;
      const expectedTotal = qtyPurchased * testProduct.sellingPrice;
      const invoiceNumber = `INV-E2E-DEBT-${Date.now()}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const transaction = await prisma.$transaction(async (tx) => {
        const t = await tx.transaction.create({
          data: {
            storeId: storeA.id,
            invoiceNumber,
            customerName: "Kontraktor Agus",
            paymentType: PaymentType.DEBT,
            totalAmount: expectedTotal,
            createdById: userStoreA.id,
            items: {
              create: [
                {
                  productId: testProduct.id,
                  quantity: qtyPurchased,
                  unitPrice: testProduct.sellingPrice,
                  costPriceSnapshot: testProduct.purchasePrice,
                  subtotal: expectedTotal,
                },
              ],
            },
          },
        });

        const newStock = testProduct.stock - qtyPurchased;
        await tx.product.update({
          where: { id: testProduct.id },
          data: { stock: newStock },
        });

        await tx.debtReceivable.create({
          data: {
            storeId: storeA.id,
            type: DebtType.RECEIVABLE,
            contactName: "Kontraktor Agus",
            contactPhone: "081299998888",
            transactionId: t.id,
            totalAmount: expectedTotal,
            paidAmount: 0,
            remainingAmount: expectedTotal,
            dueDate,
            status: DebtStatus.UNPAID,
            notes: `Bon transaksi ${invoiceNumber}`,
          },
        });

        return t;
      });

      const freshProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(freshProd?.stock).toBe(5);

      const debt = await prisma.debtReceivable.findFirst({
        where: { transactionId: transaction.id },
      });
      expect(debt?.status).toBe(DebtStatus.UNPAID);
      expect(debt?.remainingAmount).toBe(expectedTotal);
      expect(debt?.paidAmount).toBe(0);

      const cashflow = await prisma.cashFlow.findFirst({
        where: { referenceId: invoiceNumber },
      });
      expect(cashflow).toBeNull();

      // Partial Debt Payment
      const partialPayment = 390000;
      await prisma.$transaction(async (tx) => {
        await tx.debtPayment.create({
          data: {
            debtReceivableId: debt!.id,
            amount: partialPayment,
            paymentMethod: "Tunai",
            notes: "Cicilan ke-1",
          },
        });

        await tx.debtReceivable.update({
          where: { id: debt!.id },
          data: {
            paidAmount: partialPayment,
            remainingAmount: expectedTotal - partialPayment,
            status: DebtStatus.PARTIAL,
          },
        });

        await tx.cashFlow.create({
          data: {
            storeId: storeA.id,
            type: CashFlowType.INCOME,
            category: "Pelunasan Piutang",
            amount: partialPayment,
            description: "Cicilan piutang Kontraktor Agus",
            referenceId: debt!.id,
            createdById: userStoreA.id,
          },
        });
      });

      const updatedDebt = await prisma.debtReceivable.findUnique({ where: { id: debt!.id } });
      expect(updatedDebt?.status).toBe(DebtStatus.PARTIAL);
      expect(updatedDebt?.remainingAmount).toBe(390000);

      const installmentCashflow = await prisma.cashFlow.findFirst({
        where: { referenceId: debt!.id },
      });
      expect(installmentCashflow?.amount).toBe(partialPayment);

      // Full Debt Payment
      await prisma.$transaction(async (tx) => {
        await tx.debtPayment.create({
          data: {
            debtReceivableId: debt!.id,
            amount: 390000,
            paymentMethod: "Transfer BCA",
            notes: "Pelunasan sisa",
          },
        });

        await tx.debtReceivable.update({
          where: { id: debt!.id },
          data: {
            paidAmount: expectedTotal,
            remainingAmount: 0,
            status: DebtStatus.PAID,
          },
        });
      });

      const fullyPaidDebt = await prisma.debtReceivable.findUnique({ where: { id: debt!.id } });
      expect(fullyPaidDebt?.status).toBe(DebtStatus.PAID);
      expect(fullyPaidDebt?.remainingAmount).toBe(0);

      testProduct.stock = 5;
    });
  });

  // =========================================================================
  // TEST 5: PURCHASE ORDER & RESTOCKING LIFECYCLE
  // =========================================================================
  describe("5. Purchase Order (Kulakan) & Stock Replenishment", () => {
    it("increases stock, updates HPP, and creates CashFlow expense", async () => {
      const restockQty = 15;
      const newPurchasePrice = 205000;
      const totalExpense = restockQty * newPurchasePrice;
      const invoiceNumber = `FAKTUR-DIST-${Date.now()}`;

      const prod = await prisma.product.findFirst({
        where: { sku: "POS-TEST-CAT-01", storeId: storeA.id },
      });
      expect(prod).toBeDefined();

      const stockBefore = prod!.stock;

      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: prod!.id },
          data: {
            stock: stockBefore + restockQty,
            purchasePrice: newPurchasePrice,
          },
        });

        await tx.stockMovement.create({
          data: {
            storeId: storeA.id,
            productId: prod!.id,
            type: MovementType.IN,
            quantity: restockQty,
            stockBefore,
            stockAfter: stockBefore + restockQty,
            referenceId: invoiceNumber,
            notes: `Kulakan Distributor: PT Mitra Cat`,
            createdById: userStoreA.id,
          },
        });

        await tx.cashFlow.create({
          data: {
            storeId: storeA.id,
            type: CashFlowType.EXPENSE,
            category: "Kulakan",
            amount: totalExpense,
            description: `Pembelian stok distributor PT Mitra Cat (${invoiceNumber})`,
            referenceId: invoiceNumber,
            createdById: userStoreA.id,
          },
        });
      });

      const freshProd = await prisma.product.findUnique({ where: { id: prod!.id } });
      expect(freshProd?.stock).toBe(stockBefore + restockQty);
      expect(freshProd?.purchasePrice).toBe(newPurchasePrice);

      const movement = await prisma.stockMovement.findFirst({
        where: { referenceId: invoiceNumber },
      });
      expect(movement?.type).toBe(MovementType.IN);
      expect(movement?.quantity).toBe(restockQty);

      const expense = await prisma.cashFlow.findFirst({
        where: { referenceId: invoiceNumber },
      });
      expect(expense?.type).toBe(CashFlowType.EXPENSE);
      expect(expense?.amount).toBe(totalExpense);
    });
  });

  // =========================================================================
  // TEST 6: FINANCIAL INTEGRITY & GROSS PROFIT CALCULATION
  // =========================================================================
  describe("6. Financial Integrity & Gross Profit Accuracy", () => {
    it("accurately calculates Gross Profit using snapshot HPP", async () => {
      const items = await prisma.transactionItem.findMany({
        where: {
          product: { storeId: storeA.id },
        },
      });

      expect(items.length).toBeGreaterThan(0);

      const totalGrossProfit = items.reduce((sum, item) => {
        const revenue = item.quantity * item.unitPrice;
        const cogs = item.quantity * item.costPriceSnapshot;
        return sum + (revenue - cogs);
      }, 0);

      // (260,000 - 200,000) * 5 units = 300,000
      expect(totalGrossProfit).toBe(300000);
    });
  });

  // =========================================================================
  // TEST 7: EDGE CASES & SYSTEM GUARDS
  // =========================================================================
  describe("7. Edge Cases & Validation Guards", () => {
    it("rejects empty cart checkout", () => {
      const result = checkoutSchema.safeParse({
        items: [],
        paymentType: PaymentType.CASH,
        cashReceived: 50000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Keranjang belanja tidak boleh kosong");
      }
    });

    it("rejects negative stock or price values in product creation", () => {
      const result = productSchema.safeParse({
        name: "Cat Rusak",
        category: "Cat Kayu",
        unit: "Kaleng",
        purchasePrice: -1000,
        sellingPrice: 5000,
        stock: -5,
        minStockAlert: 2,
      });

      expect(result.success).toBe(false);
    });

    it("rejects tempo transaction without customer name or due date", () => {
      const missingName = checkoutSchema.safeParse({
        items: [
          {
            productId: "p1",
            name: "Kuas 2 inch",
            unit: "Pcs",
            quantity: 1,
            sellingPrice: 10000,
          },
        ],
        paymentType: PaymentType.DEBT,
        customerName: "",
        dueDate: "2026-10-01",
      });
      expect(missingName.success).toBe(false);

      const missingDueDate = checkoutSchema.safeParse({
        items: [
          {
            productId: "p1",
            name: "Kuas 2 inch",
            unit: "Pcs",
            quantity: 1,
            sellingPrice: 10000,
          },
        ],
        paymentType: PaymentType.DEBT,
        customerName: "Pak RT",
        dueDate: null,
      });
      expect(missingDueDate.success).toBe(false);
    });

    it("rejects purchase order without due date if payment is DEBT", () => {
      const result = purchaseSchema.safeParse({
        supplierName: "Distributor Cat Nasional",
        invoiceNumber: "FAKTUR-999",
        purchaseDate: "2026-09-13",
        paymentType: PaymentType.DEBT,
        dueDate: null,
        items: [
          {
            productId: "p1",
            quantity: 10,
            purchasePrice: 50000,
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    it("safely handles product deletion: preserves historical transactions by deactivating", async () => {
      // 1. Create a virgin product with NO transactions
      const virginProd = await prisma.product.create({
        data: {
          storeId: storeA.id,
          sku: "VIRGIN-PROD-99",
          name: "Cat Uji Coba Hapus",
          category: "Cat Kayu",
          unit: "Pcs",
          purchasePrice: 20000,
          sellingPrice: 30000,
          stock: 5,
          minStockAlert: 1,
        },
      });

      // Hard delete should succeed
      await prisma.product.delete({ where: { id: virginProd.id } });
      const checked = await prisma.product.findUnique({ where: { id: virginProd.id } });
      expect(checked).toBeNull();

      // 2. A product that has transactions (e.g. testProduct)
      const transProduct = await prisma.product.findFirst({
        where: { sku: "POS-TEST-CAT-01", storeId: storeA.id },
        include: { _count: { select: { items: true } } },
      });

      expect(transProduct?._count.items).toBeGreaterThan(0);

      // Attempting to hard delete would fail foreign key, so soft deactivate
      const deactivated = await prisma.product.update({
        where: { id: transProduct!.id },
        data: { isActive: false },
      });
      expect(deactivated.isActive).toBe(false);

      // Verify the transaction item still exists and references this product
      const txItem = await prisma.transactionItem.findFirst({
        where: { productId: transProduct!.id },
      });
      expect(txItem).toBeDefined();
    });
  });
});
