export type AppModule =
  | "dashboard"
  | "pos"
  | "inventory"
  | "purchases"
  | "debts"
  | "cashflow"
  | "users";

export type PermissionAction = "view" | "create" | "update" | "delete";

export interface PermissionRecord {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export const MODULE_DEFINITIONS: Array<{
  module: AppModule;
  label: string;
  description: string;
  actions: PermissionAction[];
}> = [
  {
    module: "dashboard",
    label: "Ringkasan Toko (Dashboard)",
    description: "Melihat laporan penjualan, grafik performa, dan ringkasan keuangan toko",
    actions: ["view"],
  },
  {
    module: "pos",
    label: "Kasir Transaksi (POS)",
    description: "Melakukan transaksi penjualan kasir, cetak nota, dan transaksi bon tempo",
    actions: ["view", "create"],
  },
  {
    module: "inventory",
    label: "Master Produk & Stok",
    description: "Katalog produk, manajemen stok barang, riwayat mutasi, dan penyesuaian stok",
    actions: ["view", "create", "update", "delete"],
  },
  {
    module: "purchases",
    label: "Kulakan Distributor",
    description: "Pencatatan pembelian stok dari distributor, faktur kulakan, dan update HPP",
    actions: ["view", "create", "update", "delete"],
  },
  {
    module: "debts",
    label: "Hutang & Piutang",
    description: "Buku bon tempo pelanggan, hutang distributor, dan pencatatan cicilan pelunasan",
    actions: ["view", "create", "update", "delete"],
  },
  {
    module: "cashflow",
    label: "Buku Kas & Keuangan",
    description: "Catatan arus kas operasional toko, beban pengeluaran, dan laba kotor",
    actions: ["view", "create", "delete"],
  },
  {
    module: "users",
    label: "Manajemen Staf Toko",
    description: "Daftar pengguna toko, pembuatan akun staf baru, dan reset password staf",
    actions: ["view", "create", "update", "delete"],
  },
];

export function hasPermission(
  permissions: PermissionRecord[] | undefined,
  module: string,
  action: PermissionAction = "view"
): boolean {
  if (!permissions) return false;

  const found = permissions.find((p) => p.module === module);
  if (!found) return false;

  switch (action) {
    case "view":
      return !!found.canView;
    case "create":
      return !!found.canCreate;
    case "update":
      return !!found.canUpdate;
    case "delete":
      return !!found.canDelete;
    default:
      return false;
  }
}
