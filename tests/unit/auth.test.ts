import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  userHasPermission,
} from "@/lib/auth";

describe("Auth & RBAC Utilities", () => {
  it("should hash password and verify correctly", async () => {
    const password = "mySecretPassword123";
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(20);

    const isMatch = await verifyPassword(password, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("wrongpassword", hashed);
    expect(isWrongMatch).toBe(false);
  });

  it("should sign and verify session JWT token", async () => {
    const userPayload = {
      id: "usr_12345",
      name: "Budi Owner",
      username: "budi",
      roleId: "role_owner_id",
      roleCode: "OWNER",
      roleName: "Owner Toko",
      storeId: "store_1",
      storeName: "Toko Cat Sumber Rejeki",
      permissions: [
        { module: "dashboard", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "pos", canView: true, canCreate: true, canUpdate: true, canDelete: true },
      ],
    };

    const token = await signSessionToken(userPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(userPayload.id);
    expect(decoded?.username).toBe(userPayload.username);
    expect(decoded?.roleCode).toBe("OWNER");
    expect(decoded?.storeId).toBe("store_1");
  });

  it("should return null for invalid or tampered session token", async () => {
    const invalidToken = "eyJhGciOiJIUzI1NiJ9.tampered.token";
    const decoded = await verifySessionToken(invalidToken);
    expect(decoded).toBeNull();
  });

  it("should enforce granular RBAC access correctly", () => {
    const cashierUser = {
      id: "u1",
      name: "Siti Kasir",
      username: "siti",
      roleId: "r1",
      roleCode: "CASHIER",
      roleName: "Kasir",
      storeId: "s1",
      permissions: [
        { module: "pos", canView: true, canCreate: true, canUpdate: false, canDelete: false },
        { module: "inventory", canView: true, canCreate: false, canUpdate: false, canDelete: false },
      ],
    };

    const superAdminUser = {
      id: "admin1",
      name: "Master",
      username: "admin",
      roleId: "r_master",
      roleCode: "SUPERADMIN",
      roleName: "Super Administrator",
      permissions: [],
    };

    // Cashier can view and create in POS
    expect(userHasPermission(cashierUser, "pos", "view")).toBe(true);
    expect(userHasPermission(cashierUser, "pos", "create")).toBe(true);

    // Cashier cannot delete in POS or create in inventory
    expect(userHasPermission(cashierUser, "pos", "delete")).toBe(false);
    expect(userHasPermission(cashierUser, "inventory", "create")).toBe(false);

    // SuperAdmin has bypass access to all modules and actions
    expect(userHasPermission(superAdminUser, "dashboard", "view")).toBe(true);
    expect(userHasPermission(superAdminUser, "inventory", "delete")).toBe(true);
    expect(userHasPermission(superAdminUser, "cashflow", "create")).toBe(true);
  });
});
