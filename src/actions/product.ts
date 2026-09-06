"use server";

import prisma from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { productSchema, stockAdjustmentSchema, CreateProductInput, StockAdjustmentInput } from "@/lib/validations/product";
import { Role, MovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getProducts(options?: {
  search?: string;
  category?: string;
  filter?: "all" | "low" | "empty";
}) {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const { search, category, filter = "all" } = options || {};

  const whereClause: any = {
    isActive: true,
  };

  if (category && category !== "ALL") {
    whereClause.category = category;
  }

  if (search && search.trim() !== "") {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
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

  // Mask purchasePrice for CASHIER
  if (session.role === Role.CASHIER) {
    return filtered.map((p) => ({
      ...p,
      purchasePrice: null,
    }));
  }

  return filtered;
}

export async function createProduct(input: CreateProductInput) {
  const session = await requireRole([Role.OWNER]);
  const parsed = productSchema.parse(input);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
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
  await requireRole([Role.OWNER]);

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
  const session = await requireRole([Role.OWNER]);
  const parsed = stockAdjustmentSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: parsed.productId },
    });

    if (!product) {
      throw new Error("Barang tidak ditemukan");
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
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return await prisma.stockMovement.findMany({
    where: { productId },
    include: {
      createdBy: {
        select: { name: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getCategories(): Promise<string[]> {
  const products = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return products.map((p) => p.category);
}
