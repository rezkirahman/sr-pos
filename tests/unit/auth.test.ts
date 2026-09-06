import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  hasRoleAccess,
} from "@/lib/auth";
import { Role } from "@prisma/client";

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
      role: Role.OWNER,
    };

    const token = await signSessionToken(userPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(userPayload.id);
    expect(decoded?.username).toBe(userPayload.username);
    expect(decoded?.role).toBe(Role.OWNER);
  });

  it("should return null for invalid or tampered session token", async () => {
    const invalidToken = "eyJhGciOiJIUzI1NiJ9.tampered.token";
    const decoded = await verifySessionToken(invalidToken);
    expect(decoded).toBeNull();
  });

  it("should enforce role-based access correctly", () => {
    // Owner should have access to OWNER routes
    expect(hasRoleAccess(Role.OWNER, [Role.OWNER])).toBe(true);
    // Owner should have access to CASHIER and OWNER routes
    expect(hasRoleAccess(Role.OWNER, [Role.OWNER, Role.CASHIER])).toBe(true);

    // Cashier should have access to CASHIER routes
    expect(hasRoleAccess(Role.CASHIER, [Role.CASHIER])).toBe(true);

    // Cashier should NOT have access to OWNER-only routes
    expect(hasRoleAccess(Role.CASHIER, [Role.OWNER])).toBe(false);
  });
});
