import { PrismaClient, Role, PaymentType, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Default Users (Owner & Cashier)
  const passwordOwner = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      name: "Bambang (Pemilik Toko)",
      username: "owner",
      passwordHash: passwordOwner,
      role: Role.OWNER,
    },
  });

  const passwordKasir = await bcrypt.hash("kasir123", 10);
  const kasir = await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      name: "Siti Rahma (Kasir)",
      username: "kasir",
      passwordHash: passwordKasir,
      role: Role.CASHIER,
    },
  });

  console.log(`Users seeded: ${owner.username}, ${kasir.username}`);

  // 2. Create Products
  const sampleProducts = [
    {
      sku: "CAT-VNLX-005",
      name: "Cat Tembok Vinilex 5 Kg Brilliant White",
      category: "Cat Tembok",
      unit: "Galon",
      purchasePrice: 110000,
      sellingPrice: 135000,
      stock: 24,
      minStockAlert: 5,
    },
    {
      sku: "CAT-VNLX-025",
      name: "Cat Tembok Vinilex 25 Kg Super White (Pail)",
      category: "Cat Tembok",
      unit: "Pail",
      purchasePrice: 520000,
      sellingPrice: 625000,
      stock: 8,
      minStockAlert: 3,
    },
    {
      sku: "CAT-DLX-WS025",
      name: "Cat Dulux Weathershield 2.5 L Eksterior",
      category: "Cat Tembok",
      unit: "Galon",
      purchasePrice: 245000,
      sellingPrice: 295000,
      stock: 12,
      minStockAlert: 4,
    },
    {
      sku: "CAT-AVN-001",
      name: "Cat Kayu & Besi Avian Sintetis 1 Kg Hitam Kilap",
      category: "Cat Kayu & Besi",
      unit: "Kaleng",
      purchasePrice: 62000,
      sellingPrice: 78000,
      stock: 30,
      minStockAlert: 6,
    },
    {
      sku: "SMN-TR-040",
      name: "Semen Tiga Roda Portland Composite 40 Kg",
      category: "Semen",
      unit: "Sak",
      purchasePrice: 53000,
      sellingPrice: 61000,
      stock: 65,
      minStockAlert: 20,
    },
    {
      sku: "SMN-GRSK-050",
      name: "Semen Gresik PPC 50 Kg",
      category: "Semen",
      unit: "Sak",
      purchasePrice: 64000,
      sellingPrice: 73000,
      stock: 45,
      minStockAlert: 15,
    },
    {
      sku: "THN-ASP-001",
      name: "Thinner A Spesial Botol 1 Liter",
      category: "Thinner & Pelarut",
      unit: "Botol",
      purchasePrice: 22000,
      sellingPrice: 30000,
      stock: 40,
      minStockAlert: 10,
    },
    {
      sku: "THN-ND-005",
      name: "Thinner Super High Gloss Cobra ND Jerigen 5 Liter",
      category: "Thinner & Pelarut",
      unit: "Jerigen",
      purchasePrice: 115000,
      sellingPrice: 145000,
      stock: 3, // Menipis
      minStockAlert: 5,
    },
    {
      sku: "KUS-ECL-003",
      name: "Kuas Cat Eterna 3 Inch",
      category: "Alat Pertukangan",
      unit: "Pcs",
      purchasePrice: 12000,
      sellingPrice: 18000,
      stock: 50,
      minStockAlert: 10,
    },
    {
      sku: "ROL-ACE-009",
      name: "Rol Cat Tembok Ace Oldfields 9 Inch Lengkap Gagang",
      category: "Alat Pertukangan",
      unit: "Pcs",
      purchasePrice: 28000,
      sellingPrice: 38000,
      stock: 18,
      minStockAlert: 5,
    },
    {
      sku: "NO-DROP-004",
      name: "Pelapis Anti Bocor No Drop 4 Kg Abu-abu",
      category: "Waterproofing",
      unit: "Galon",
      purchasePrice: 195000,
      sellingPrice: 235000,
      stock: 15,
      minStockAlert: 4,
    },
    {
      sku: "PLAMIR-RJ-005",
      name: "Plamir Tembok RJ London 5 Kg Siap Pakai",
      category: "Plamir & Dempul",
      unit: "Galon",
      purchasePrice: 48000,
      sellingPrice: 62000,
      stock: 2, // Stok menipis
      minStockAlert: 5,
    },
  ];

  for (const prod of sampleProducts) {
    const existing = await prisma.product.findUnique({
      where: { sku: prod.sku },
    });
    if (!existing) {
      const created = await prisma.product.create({
        data: prod,
      });

      // Record initial stock movement
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: MovementType.IN,
          quantity: prod.stock,
          stockBefore: 0,
          stockAfter: prod.stock,
          notes: "Inisialisasi stok awal sistem",
          createdById: owner.id,
        },
      });
    }
  }

  console.log("Sample products seeded with initial stock movements.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
