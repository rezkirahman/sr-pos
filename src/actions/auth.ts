"use server";

import prisma from "@/lib/prisma";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { verifyPassword, createSession, clearSession, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

export async function loginAction(input: LoginInput): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Input tidak valid",
    };
  }

  const { username, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        store: true,
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Username atau password salah",
      };
    }

    const isSuperAdmin = user.role.code === "SUPERADMIN";

    // Non-superadmin must have an active store
    if (!isSuperAdmin) {
      if (!user.store || !user.store.isActive) {
        return {
          success: false,
          error: "Toko Anda sedang dinonaktifkan atau belum terdaftar",
        };
      }
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        error: "Username atau password salah",
      };
    }

    const permissions = user.role.permissions.map((p) => ({
      module: p.module,
      canView: p.canView,
      canCreate: p.canCreate,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete,
    }));

    await createSession({
      id: user.id,
      name: user.name,
      username: user.username,
      roleId: user.role.id,
      roleCode: user.role.code,
      roleName: user.role.name,
      storeId: user.storeId,
      storeName: user.store?.name || null,
      permissions,
    });

    let redirectUrl = "/pos";
    if (isSuperAdmin) {
      redirectUrl = "/master";
    } else if (permissions.some((p) => p.module === "dashboard" && p.canView)) {
      redirectUrl = "/dashboard";
    }

    return {
      success: true,
      redirectUrl,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan server saat proses masuk",
    };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function getCurrentUser() {
  return await getSession();
}
