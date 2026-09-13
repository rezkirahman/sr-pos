"use server";

import prisma from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { createUserSchema, resetPasswordSchema, CreateUserInput, ResetPasswordInput } from "@/lib/validations/user";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const session = await requireRole([Role.OWNER]);

  return await prisma.user.findMany({
    where: { storeId: session.storeId },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createUser(input: CreateUserInput) {
  const session = await requireRole([Role.OWNER]);
  const parsed = createUserSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { username: parsed.username },
  });

  if (existing) {
    throw new Error(`Username "${parsed.username}" sudah digunakan.`);
  }

  const hashedPassword = await hashPassword(parsed.password);

  const user = await prisma.user.create({
    data: {
      storeId: session.storeId,
      name: parsed.name,
      username: parsed.username,
      passwordHash: hashedPassword,
      role: parsed.role,
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  revalidatePath("/users");
  return { success: true, user };
}

export async function resetUserPassword(input: ResetPasswordInput) {
  const session = await requireRole([Role.OWNER]);
  const parsed = resetPasswordSchema.parse(input);

  const existing = await prisma.user.findFirst({
    where: { id: parsed.userId, storeId: session.storeId },
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
  const session = await requireRole([Role.OWNER]);

  if (session.id === id) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const existing = await prisma.user.findFirst({
    where: { id, storeId: session.storeId },
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
