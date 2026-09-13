"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. STORE MANAGEMENT (MASTER)
// ==========================================

export async function getMasterStores() {
  await requireSuperAdmin();

  return await prisma.store.findMany({
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          transactions: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          username: true,
          role: {
            select: { name: true, code: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMasterStore(input: {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  ownerName: string;
  ownerUsername: string;
  ownerPassword: string;
}) {
  await requireSuperAdmin();

  const existingCode = await prisma.store.findUnique({
    where: { code: input.code.trim().toUpperCase() },
  });
  if (existingCode) {
    throw new Error(`Kode toko "${input.code}" sudah digunakan.`);
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username: input.ownerUsername.trim() },
  });
  if (existingUsername) {
    throw new Error(`Username "${input.ownerUsername}" sudah digunakan.`);
  }

  // Find Owner role
  const ownerRole = await prisma.role.findUnique({
    where: { code: "OWNER" },
  });
  if (!ownerRole) {
    throw new Error("Role OWNER sistem tidak ditemukan.");
  }

  const hashedPassword = await hashPassword(input.ownerPassword);

  const result = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        isActive: true,
      },
    });

    const owner = await tx.user.create({
      data: {
        storeId: store.id,
        roleId: ownerRole.id,
        name: input.ownerName.trim(),
        username: input.ownerUsername.trim(),
        passwordHash: hashedPassword,
      },
    });

    return { store, owner };
  });

  revalidatePath("/master");
  revalidatePath("/master/stores");
  revalidatePath("/master/users");

  return { success: true, ...result };
}

export async function updateMasterStore(
  storeId: string,
  input: {
    name?: string;
    address?: string;
    phone?: string;
    isActive?: boolean;
  }
) {
  await requireSuperAdmin();

  const updated = await prisma.store.update({
    where: { id: storeId },
    data: {
      name: input.name?.trim(),
      address: input.address !== undefined ? input.address : undefined,
      phone: input.phone !== undefined ? input.phone : undefined,
      isActive: input.isActive !== undefined ? input.isActive : undefined,
    },
  });

  revalidatePath("/master");
  revalidatePath("/master/stores");

  return { success: true, store: updated };
}

// ==========================================
// 2. GLOBAL USER MANAGEMENT & DIRECT RESET PASSWORD
// ==========================================

export async function getMasterUsers(storeId?: string) {
  await requireSuperAdmin();

  const whereClause: any = {};
  if (storeId && storeId !== "ALL") {
    whereClause.storeId = storeId;
  }

  return await prisma.user.findMany({
    where: whereClause,
    include: {
      store: {
        select: { id: true, name: true, code: true, isActive: true },
      },
      role: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Super Admin can reset user password directly without knowing old password
 */
export async function masterResetUserPassword(userId: string, newPassword: string) {
  await requireSuperAdmin();

  if (!newPassword || newPassword.length < 5) {
    throw new Error("Password baru minimal harus 5 karakter.");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  revalidatePath("/master/users");
  return { success: true, message: "Password berhasil diubah." };
}

export async function masterUpdateUserRole(userId: string, roleId: string) {
  await requireSuperAdmin();

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!targetUser) {
    throw new Error("User tidak ditemukan.");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { roleId },
  });

  revalidatePath("/master/users");
  return { success: true, user: updated };
}

export async function masterDeleteUser(userId: string) {
  const session = await requireSuperAdmin();

  if (session.id === userId) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (target?.role.code === "SUPERADMIN") {
    throw new Error("Akun Super Admin tidak dapat dihapus.");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/master/users");
  return { success: true };
}

// ==========================================
// 3. ROLE & PERMISSION MANAGEMENT (DYNAMIC RBAC)
// ==========================================

export async function getRolesWithPermissions() {
  await requireSuperAdmin();

  return await prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createCustomRole(input: {
  name: string;
  description?: string;
  permissions: Array<{
    module: string;
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
}) {
  await requireSuperAdmin();

  if (!input.name || input.name.trim() === "") {
    throw new Error("Nama role wajib diisi.");
  }

  const code = input.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_");

  const existing = await prisma.role.findUnique({
    where: { code },
  });
  if (existing) {
    throw new Error(`Role dengan kode "${code}" sudah terdaftar.`);
  }

  const created = await prisma.role.create({
    data: {
      name: input.name.trim(),
      code,
      description: input.description?.trim() || null,
      isSystem: false,
      permissions: {
        create: input.permissions.map((p) => ({
          module: p.module,
          canView: p.canView,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
        })),
      },
    },
    include: { permissions: true },
  });

  revalidatePath("/master/roles");
  return { success: true, role: created };
}

export async function updateCustomRole(
  roleId: string,
  input: {
    name: string;
    description?: string;
    permissions: Array<{
      module: string;
      canView: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    }>;
  }
) {
  await requireSuperAdmin();

  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });
  if (!role) {
    throw new Error("Role tidak ditemukan.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update role info
    await tx.role.update({
      where: { id: roleId },
      data: {
        name: input.name.trim(),
        description: input.description !== undefined ? input.description?.trim() : undefined,
      },
    });

    // 2. Re-sync permissions
    // Delete existing
    await tx.rolePermission.deleteMany({
      where: { roleId },
    });

    // Re-create
    await tx.rolePermission.createMany({
      data: input.permissions.map((p) => ({
        roleId,
        module: p.module,
        canView: p.canView,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      })),
    });
  });

  revalidatePath("/master/roles");
  return { success: true };
}

export async function deleteCustomRole(roleId: string) {
  await requireSuperAdmin();

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  if (!role) {
    throw new Error("Role tidak ditemukan.");
  }

  if (role.isSystem) {
    throw new Error("Role bawaan sistem tidak dapat dihapus.");
  }

  if (role._count.users > 0) {
    throw new Error(`Role ini masih digunakan oleh ${role._count.users} pengguna.`);
  }

  await prisma.role.delete({
    where: { id: roleId },
  });

  revalidatePath("/master/roles");
  return { success: true };
}
