import { PrismaClient, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding multi-tenant database with dynamic roles and Master account...");

  const defaultPassword = await bcrypt.hash("owner123", 10);
  const cashierPassword = await bcrypt.hash("kasir123", 10);
  const masterPassword = await bcrypt.hash("admin123", 10);

  // 1. Create Default Roles & Permissions
  const rolesData = [
    {
      code: "SUPERADMIN",
      name: "Super Administrator",
      description: "Akses penuh platform, manajemen seluruh toko, pengguna, dan role",
      isSystem: true,
      permissions: [
        { module: "dashboard", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "pos", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "inventory", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "purchases", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "debts", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "cashflow", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "users", canView: true, canCreate: true, canUpdate: true, canDelete: true },
      ],
    },
    {
      code: "OWNER",
      name: "Pemilik Toko (Owner)",
      description: "Akses penuh seluruh fitur operasional dan keuangan toko",
      isSystem: true,
      permissions: [
        { module: "dashboard", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "pos", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "inventory", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "purchases", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "debts", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "cashflow", canView: true, canCreate: true, canUpdate: true, canDelete: true },
        { module: "users", canView: true, canCreate: true, canUpdate: true, canDelete: true },
      ],
    },
    {
      code: "CASHIER",
      name: "Kasir",
      description: "Akses mesin kasir (POS), lihat stok produk, dan buku bon piutang",
      isSystem: true,
      permissions: [
        { module: "dashboard", canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { module: "pos", canView: true, canCreate: true, canUpdate: false, canDelete: false },
        { module: "inventory", canView: true, canCreate: false, canUpdate: false, canDelete: false },
        { module: "purchases", canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { module: "debts", canView: true, canCreate: false, canUpdate: false, canDelete: false },
        { module: "cashflow", canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { module: "users", canView: false, canCreate: false, canUpdate: false, canDelete: false },
      ],
    },
    {
      code: "WAREHOUSE",
      name: "Admin Gudang",
      description: "Akses manajemen katalog produk, penyesuaian stok, dan kulakan distributor",
      isSystem: false,
      permissions: [
        { module: "dashboard", canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { module: "pos", canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { module: "inventory", canView: true, canCreate: true, canUpdate: true, canDelete: false },
        { module: "purchases", canView: true, canCreate: true, canUpdate: true, canDelete: false },
        { module: "debts", canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { module: "cashflow", canView: false, canCreate: false, canUpdate: false, canDelete: false },
        { module: "users", canView: false, canCreate: false, canUpdate: false, canDelete: false },
      ],
    },
  ];

  const roleMap = new Map<string, any>();

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        description: r.description,
      },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
      },
    });

    roleMap.set(r.code, role);

    // Sync permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: r.permissions.map((p) => ({
        roleId: role.id,
        module: p.module,
        canView: p.canView,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      })),
    });
  }

  console.log("Roles and permissions seeded.");

  // 2. Create Master Super Admin User (Bebas Toko)
  const superAdminRole = roleMap.get("SUPERADMIN")!;
  const masterUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      roleId: superAdminRole.id,
      storeId: null,
      passwordHash: masterPassword,
    },
    create: {
      name: "Super Administrator",
      username: "admin",
      passwordHash: masterPassword,
      roleId: superAdminRole.id,
      storeId: null,
    },
  });

  console.log(`Master Super Admin created: @${masterUser.username} (password: admin123)`);

  // 3. Create 5 Sample Stores
  const storesData = [
    {
      code: "TK01",
      name: "Toko Cat Sumber Rejeki",
      address: "Jl. Raya Veteran No. 12",
      phone: "0812-3456-7890",
      owner: { name: "Bambang (Pemilik)", username: "owner" },
      cashier: { name: "Siti Rahma (Kasir)", username: "kasir" },
    },
    {
      code: "TK02",
      name: "TB Berkah Abadi",
      address: "Jl. Ahmad Yani No. 45",
      phone: "0813-9876-5432",
      owner: { name: "H. Ahmad (Pemilik)", username: "owner2" },
      cashier: { name: "Budi Santoso (Kasir)", username: "kasir2" },
    },
    {
      code: "TK03",
      name: "Toko Cat Makmur Sentosa",
      address: "Jl. Pahlawan No. 88",
      phone: "0811-2233-4455",
      owner: { name: "Hendra Wijaya (Pemilik)", username: "owner3" },
      cashier: { name: "Dewi Lestari (Kasir)", username: "kasir3" },
    },
    {
      code: "TK04",
      name: "TB Maju Bersama",
      address: "Jl. Sudirman No. 201",
      phone: "0821-5566-7788",
      owner: { name: "Joko Susilo (Pemilik)", username: "owner4" },
      cashier: { name: "Agus Pratama (Kasir)", username: "kasir4" },
    },
    {
      code: "TK05",
      name: "Kharisma Paint Center",
      address: "Jl. Diponegoro No. 15",
      phone: "0852-3344-5566",
      owner: { name: "Rina Kusuma (Pemilik)", username: "owner5" },
      cashier: { name: "Fitri Handayani (Kasir)", username: "kasir5" },
    },
  ];

  const sampleCatalog = [
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
      stock: 3,
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
      stock: 2,
      minStockAlert: 5,
    },
  ];

  const ownerRole = roleMap.get("OWNER")!;
  const cashierRole = roleMap.get("CASHIER")!;

  for (const s of storesData) {
    const store = await prisma.store.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        address: s.address,
        phone: s.phone,
      },
      create: {
        code: s.code,
        name: s.name,
        address: s.address,
        phone: s.phone,
      },
    });

    const ownerUser = await prisma.user.upsert({
      where: { username: s.owner.username },
      update: {
        storeId: store.id,
        roleId: ownerRole.id,
      },
      create: {
        storeId: store.id,
        roleId: ownerRole.id,
        name: s.owner.name,
        username: s.owner.username,
        passwordHash: defaultPassword,
      },
    });

    await prisma.user.upsert({
      where: { username: s.cashier.username },
      update: {
        storeId: store.id,
        roleId: cashierRole.id,
      },
      create: {
        storeId: store.id,
        roleId: cashierRole.id,
        name: s.cashier.name,
        username: s.cashier.username,
        passwordHash: cashierPassword,
      },
    });

    for (const prod of sampleCatalog) {
      const existingProduct = await prisma.product.findUnique({
        where: {
          storeId_sku: {
            storeId: store.id,
            sku: prod.sku,
          },
        },
      });

      if (!existingProduct) {
        const created = await prisma.product.create({
          data: {
            ...prod,
            storeId: store.id,
          },
        });

        await prisma.stockMovement.create({
          data: {
            storeId: store.id,
            productId: created.id,
            type: MovementType.IN,
            quantity: prod.stock,
            stockBefore: 0,
            stockAfter: prod.stock,
            notes: `Inisialisasi stok awal toko ${store.name}`,
            createdById: ownerUser.id,
          },
        });
      }
    }
  }

  console.log("All 5 stores, catalogs, and users seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
