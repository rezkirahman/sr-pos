"use server";

import prisma from "@/lib/prisma";
import { requirePermission, hashPassword } from "@/lib/auth";
import { createUserSchema, resetPasswordSchema, CreateUserInput, ResetPasswordInput } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const session = await requirePermission("users", "view");

  const whereClause: any = {};
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  return await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getStoreRoles() {
  // Return non-superadmin roles available for store staff
  return await prisma.role.findMany({
    where: {
      code: { not: "SUPERADMIN" },
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createUser(input: CreateUserInput) {
  const session = await requirePermission("users", "create");
  if (!session.storeId) {
    throw new Error("Akun Super Admin tidak dapat membuat pengguna toko dari halaman ini.");
  }

  const parsed = createUserSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { username: parsed.username },
  });

  if (existing) {
    throw new Error(`Username "${parsed.username}" sudah digunakan.`);
  }

  const role = await prisma.role.findUnique({
    where: { id: parsed.roleId },
  });

  if (!role || role.code === "SUPERADMIN") {
    throw new Error("Role yang dipilih tidak valid.");
  }

  const hashedPassword = await hashPassword(parsed.password);

  const user = await prisma.user.create({
    data: {
      storeId: session.storeId!,
      roleId: role.id,
      name: parsed.name,
      username: parsed.username,
      passwordHash: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  revalidatePath("/users");
  return { success: true, user };
}

export async function resetUserPassword(input: ResetPasswordInput) {
  const session = await requirePermission("users", "update");
  const parsed = resetPasswordSchema.parse(input);

  const whereClause: any = { id: parsed.userId };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  const existing = await prisma.user.findFirst({
    where: whereClause,
  });

  if (!existing) {
    throw new Error("Pengguna tidak ditemukan di toko ini.");
  }

  const hashedPassword = await hashPassword(parsed.newPassword);

  await prisma.user.update({
    where: { id: parsed.userId },
    data: { passwordHash: hashedPassword },
  });

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await requirePermission("users", "delete");

  if (session.id === id) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const whereClause: any = { id };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  const existing = await prisma.user.findFirst({
    where: whereClause,
  });

  if (!existing) {
    throw new Error("Pengguna tidak ditemukan di toko ini.");
  }

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/users");
  return { success: true };
}
