import { describe, it, expect } from "vitest";

export function validateNewUserData(data: {
  name: string;
  username: string;
  password: string;
  roleId: string;
}): { isValid: boolean; error?: string } {
  if (data.name.trim().length < 2) {
    return { isValid: false, error: "Nama minimal 2 karakter" };
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
    return { isValid: false, error: "Username harus 3-20 karakter alfanumerik" };
  }
  if (data.password.length < 6) {
    return { isValid: false, error: "Password minimal 6 karakter" };
  }
  if (!data.roleId) {
    return { isValid: false, error: "Role wajib dipilih" };
  }
  return { isValid: true };
}

describe("User Management Validation Logic", () => {
  it("should validate good user data", () => {
    const res = validateNewUserData({
      name: "Budi Santoso",
      username: "budi_kasir2",
      password: "password123",
      roleId: "role_cashier_id",
    });
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it("should reject short username or password", () => {
    const shortUser = validateNewUserData({
      name: "Budi",
      username: "bu",
      password: "password123",
      roleId: "role_cashier_id",
    });
    expect(shortUser.isValid).toBe(false);

    const shortPass = validateNewUserData({
      name: "Budi",
      username: "budikasir",
      password: "123",
      roleId: "role_cashier_id",
    });
    expect(shortPass.isValid).toBe(false);
  });
});
