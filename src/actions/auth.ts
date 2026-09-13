"use server";

import prisma from "@/lib/prisma";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { verifyPassword, createSession, clearSession, getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
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
      include: { store: true },
    });

    if (!user) {
      return {
        success: false,
        error: "Username atau password salah",
      };
    }

    if (!user.store || !user.store.isActive) {
      return {
        success: false,
        error: "Toko atau akun Anda sedang dinonaktifkan",
      };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        error: "Username atau password salah",
      };
    }

    await createSession({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      storeId: user.storeId,
      storeName: user.store.name,
    });

    const redirectUrl = user.role === Role.OWNER ? "/dashboard" : "/pos";
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
