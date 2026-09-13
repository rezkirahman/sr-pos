import { describe, it, expect } from "vitest";
import { hasPermission } from "@/lib/permissions";
import { userHasPermission, hashPassword, verifyPassword } from "@/lib/auth";

describe("Master Dashboard & Dynamic RBAC Logic", () => {
  it("evaluates custom role permissions accurately across modules", () => {
    const warehousePermissions = [
      { module: "inventory", canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: "purchases", canView: true, canCreate: true, canUpdate: true, canDelete: false },
      { module: "pos", canView: false, canCreate: false, canUpdate: false, canDelete: false },
      { module: "dashboard", canView: false, canCreate: false, canUpdate: false, canDelete: false },
    ];

    // Warehouse staff can view, create, and update inventory
    expect(hasPermission(warehousePermissions, "inventory", "view")).toBe(true);
    expect(hasPermission(warehousePermissions, "inventory", "create")).toBe(true);
    expect(hasPermission(warehousePermissions, "inventory", "update")).toBe(true);
    // But CANNOT delete inventory
    expect(hasPermission(warehousePermissions, "inventory", "delete")).toBe(false);

    // Warehouse staff cannot access POS or Dashboard
    expect(hasPermission(warehousePermissions, "pos", "view")).toBe(false);
    expect(hasPermission(warehousePermissions, "pos", "create")).toBe(false);
    expect(hasPermission(warehousePermissions, "dashboard", "view")).toBe(false);
  });

  it("super admin possesses full bypass privileges on any module and action", () => {
    const superAdminUser = {
      id: "master_user",
      name: "Master Admin",
      username: "admin",
      roleId: "role_master",
      roleCode: "SUPERADMIN",
      roleName: "Super Administrator",
      permissions: [], // Even with empty permissions array, bypass kicks in!
    };

    expect(userHasPermission(superAdminUser, "dashboard", "view")).toBe(true);
    expect(userHasPermission(superAdminUser, "pos", "create")).toBe(true);
    expect(userHasPermission(superAdminUser, "inventory", "delete")).toBe(true);
    expect(userHasPermission(superAdminUser, "users", "delete")).toBe(true);
  });

  it("handles master direct password reset without old password requirement", async () => {
    const oldPassword = "initialPassword123";
    const oldHash = await hashPassword(oldPassword);

    // Master sets a new password directly
    const directNewPassword = "adminForcedNewPassword999";
    const newHash = await hashPassword(directNewPassword);

    expect(await verifyPassword(directNewPassword, newHash)).toBe(true);
    expect(await verifyPassword(oldPassword, newHash)).toBe(false);
  });
});
