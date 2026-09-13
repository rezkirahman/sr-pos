"use server";

import prisma from "@/lib/prisma";
import { getSession, requirePermission, userHasPermission } from "@/lib/auth";
import { productSchema, stockAdjustmentSchema, CreateProductInput, StockAdjustmentInput } from "@/lib/validations/product";
import { MovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getProducts(options?: {
  search?: string;
  category?: string;
  filter?: "all" | "low" | "empty";
}) {
  const session = await requirePermission("inventory", "view");

  const { search, category, filter = "all" } = options || {};

  const whereClause: any = {
    isActive: true,
  };

  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  if (category && category !== "ALL") {
    whereClause.category = category;
  }

  if (search && search.trim() !== "") {
    whereClause.AND = [
      {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { name: "asc" },
  });

  // Client filtering for low / empty stock if requested
  let filtered = products;
  if (filter === "low") {
    filtered = products.filter((p) => p.stock <= p.minStockAlert && p.stock > 0);
  } else if (filter === "empty") {
    filtered = products.filter((p) => p.stock <= 0);
  }

  // Mask purchasePrice if user cannot update inventory (e.g. standard Cashier)
  const canSeePurchasePrice = userHasPermission(session, "inventory", "update") || session.roleCode === "SUPERADMIN";
  if (!canSeePurchasePrice) {
    return filtered.map((p) => ({
      ...p,
      purchasePrice: null,
    }));
  }

  return filtered;
}

export async function createProduct(input: CreateProductInput) {
  const session = await requirePermission("inventory", "create");
  if (!session.storeId) {
    throw new Error("Akun Super Admin tidak terikat toko. Silakan gunakan akun toko.");
  }

  const parsed = productSchema.parse(input);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        storeId: session.storeId!,
        sku: parsed.sku || null,
        name: parsed.name,
        category: parsed.category,
        unit: parsed.unit,
        purchasePrice: parsed.purchasePrice,
        sellingPrice: parsed.sellingPrice,
        stock: parsed.stock,
        minStockAlert: parsed.minStockAlert,
        isActive: parsed.isActive,
      },
    });

    if (parsed.stock > 0) {
      await tx.stockMovement.create({
        data: {
          storeId: session.storeId!,
          productId: created.id,
          type: MovementType.IN,
          quantity: parsed.stock,
          stockBefore: 0,
          stockAfter: parsed.stock,
          notes: "Penambahan stok awal produk baru",
          createdById: session.id,
        },
      });
    }

    return created;
  });

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { success: true, product };
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  const session = await requirePermission("inventory", "update");

  const whereClause: any = { id };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  const existing = await prisma.product.findFirst({
    where: whereClause,
  });

  if (!existing) {
    throw new Error("Barang tidak ditemukan di toko ini");
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      sku: input.sku !== undefined ? input.sku : undefined,
      name: input.name,
      category: input.category,
      unit: input.unit,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      minStockAlert: input.minStockAlert,
      isActive: input.isActive,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { success: true, product: updated };
}

export async function adjustStock(input: StockAdjustmentInput) {
  const session = await requirePermission("inventory", "update");

  const parsed = stockAdjustmentSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    const whereClause: any = { id: parsed.productId };
    if (session.storeId) {
      whereClause.storeId = session.storeId;
    }

    const product = await tx.product.findFirst({
      where: whereClause,
    });

    if (!product) {
      throw new Error("Barang tidak ditemukan di toko ini");
    }

    const stockBefore = product.stock;
    const stockAfter = parsed.actualStock;
    const diff = stockAfter - stockBefore;

    const updated = await tx.product.update({
      where: { id: product.id },
      data: { stock: stockAfter },
    });

    await tx.stockMovement.create({
      data: {
        storeId: product.storeId,
        productId: product.id,
        type: MovementType.ADJUSTMENT,
        quantity: Math.abs(diff),
        stockBefore,
        stockAfter,
        notes: parsed.notes,
        createdById: session.id,
      },
    });

    return updated;
  });

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { success: true, product: result };
}

export async function getStockMovements(productId: string) {
  const session = await requirePermission("inventory", "view");

  const whereClause: any = { productId };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  return await prisma.stockMovement.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getCategories(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];

  const whereClause: any = {};
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return products.map((p) => p.category);
}

export async function deleteProduct(productId: string) {
  const session = await requirePermission("inventory", "delete");

  const whereClause: any = { id: productId };
  if (session.storeId) {
    whereClause.storeId = session.storeId;
  }

  const product = await prisma.product.findFirst({
    where: whereClause,
    include: {
      _count: {
        select: {
          items: true,
          movements: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Barang tidak ditemukan di toko ini.");
  }

  // If already involved in sales transactions, soft-deactivate to protect financial history
  if (product._count.items > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true, message: "Produk dinonaktifkan karena telah memiliki riwayat transaksi." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({
      where: { productId },
    });
    await tx.product.delete({
      where: { id: productId },
    });
  });

  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { success: true, message: "Produk berhasil dihapus." };
}

