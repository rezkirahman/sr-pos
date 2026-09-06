# Product Requirements Document (PRD) & Spesifikasi Sistem
## Sistem Manajemen Toko Cat & Bangunan (Stock, Kasir, Arus Kas & Hutang Piutang)

- **Tanggal Dokumen:** 06 September 2026
- **Status:** Menunggu Review Pengguna (Design Review)
- **Target Platform:** Web Application (Responsive Desktop, Laptop & Tablet Kasir)
- **Lokasi Proyek:** `C:/Users/baru1/.gemini/antigravity/scratch/toko-cat-app`

---

## 1. Ringkasan Eksekutif (Executive Summary)
Aplikasi ini adalah sistem internal operasional toko (Backoffice & POS Kasir) yang dirancang khusus untuk toko cat dan bahan bangunan. Sistem ini mengatasi 3 masalah utama operasional toko:
1. **Pencatatan & Rekap Stok**: Mengontrol persediaan barang eceran dan grosir (cat kaleng, galon, pail, sak semen, dsb.) dengan kartu stok otomatis dan peringatan stok menipis.
2. **Pengelolaan Stok & Arus Uang (Cash Flow)**: Menghubungkan mutasi barang dengan penerimaan kas kasir (penjualan) dan pengeluaran kas toko (kulakan ke distributor, biaya operasional toko), serta menghitung laba kotor secara akurat.
3. **Pencatatan & Pengingat Hutang Piutang**: Memantau bon tempo pelanggan/tukang/kontraktor (Piutang) dan tagihan faktur distributor (Hutang Toko), lengkap dengan sistem pengingat visual jatuh tempo (badge indikator merah/kuning).

---

## 2. Sasaran Produk (Goals & Non-Goals)

### 2.1. Goals (Tujuan Utama)
- Mempercepat proses transaksi kasir dengan pencarian barang cepat dan potongan stok otomatis.
- Mencegah kehilangan barang melalui kartu stok (*stock movement audit trail*) untuk setiap barang masuk, keluar, dan penyesuaian (*stock opname*).
- Memberikan visibilitas harian dan bulanan atas arus kas masuk, arus kas keluar, serta laba kotor toko.
- Menghilangkan risiko bon macet dan denda telat bayar suplier melalui dashboard monitoring jatuh tempo hutang piutang.
- Mengamankan data rahasia toko (harga beli/modal HPP dan margin laba) dari kasir melalui pemisahan hak akses berbasis peran (*Role-Based Access Control*).

### 2.2. Non-Goals (Bukan Bagian dari Fase Awal)
- Tidak menyediakan katalog web publik / etalase e-commerce untuk pembeli umum (fokus 100% pada operasional internal toko).
- Tidak menggunakan integrasi WhatsApp Gateway / SMS otomatis pihak ketiga (pengingat jatuh tempo berbasis visual dashboard dan jadwal jatuh tempo).
- Tidak memerlukan integrasi driver printer thermal perangkat keras (pencatatan dan arsip nota berbasis digital/layar).
- Tidak mengelola formula racikan mesin tinting/oplos cat secara otomatis (tiap warna/varian didaftarkan sebagai item mandiri).

---

## 3. Persona Pengguna & Hak Akses (User Roles)

Sistem membedakan 2 jenis hak akses:

| Fitur / Menu | Pemilik Toko (`OWNER`) | Kasir Toko (`CASHIER`) |
| :--- | :---: | :---: |
| **Kasir (POS Transaksi)** | Ya (Akses Penuh) | Ya (Input Penjualan & Bon) |
| **Lihat Stok & Harga Jual** | Ya | Ya |
| **Lihat Harga Modal (HPP)** | Ya | Tidak (Disembunyikan) |
| **Tambah / Edit / Hapus Produk** | Ya | Tidak |
| **Penyesuaian Stok (Opname)** | Ya | Tidak |
| **Pencatatan Pembelian / Kulakan** | Ya | Tidak |
| **Buku Kas Pengeluaran Operasional** | Ya | Tidak |
| **Laporan Laba Rugi & Arus Kas** | Ya | Tidak |
| **Kelola Piutang (Bon Pelanggan)** | Ya (Input, Pelunasan, Hapus) | Ya (Input Bon & Catat Cicilan) |
| **Kelola Hutang ke Supplier** | Ya | Tidak |
| **Kelola Pengguna Sistem (Akun)** | Ya | Tidak |

---

## 4. Spesifikasi Fitur Utama

### 4.1. Modul Autentikasi & Pengguna
- Halaman Login aman menggunakan username dan password.
- Password di-hash menggunakan algoritma `bcryptjs`.
- Session terproteksi menggunakan HTTP-Only Cookie dengan pengecekan role di sisi server (*Server Actions Guard*).
- Akun bawaan awal (*seed data*): 1 akun Owner dan 1 akun Kasir.

### 4.2. Modul Master Produk & Rekap Stok (Inventory)
- **Model Item Mandiri**: Tiap varian ukuran didaftarkan sebagai 1 entitas barang terpisah (misal: *"Cat Vinilex 5 Kg"* dan *"Cat Vinilex 25 Kg"* memiliki SKU dan baris data masing-masing).
- Atribut Produk:
  - SKU / Kode Barang (unik, mendukung input scanner barcode)
  - Nama Produk (misal: "Cat Dulux Weathershield Brilliant White 2.5L")
  - Kategori Produk (Cat Tembok, Cat Besi/Kayu, Semen, Kuas & Roll, Thinner, Alat Pertukangan, dll.)
  - Satuan (Kaleng, Galon, Pail, Sak, Pcs, Meter, Dus, Botol, Jerigen)
  - Harga Modal / Beli (HPP)
  - Harga Jual Eceran
  - Jumlah Stok Saat Ini
  - Batas Minimum Stok (*Minimum Stock Alert threshold*)
- **Kartu Stok (Stock Movement Audit)**:
  - Setiap mutasi mencatat: Tanggal, Jenis (`IN` / `OUT` / `ADJUSTMENT`), Jumlah, Stok Sebelum, Stok Sesudah, Referensi (No Invoice/Nota), Keterangan, dan Petugas.
- **Filter & Rekap Stok**:
  - Filter cepat: "Semua Produk", "Stok Menipis" (di bawah batas minimum), "Stok Habis".
  - Ekspor rekap stok ke format CSV / Excel.

### 4.3. Modul Kasir (Point of Sale / POS)
- Tampilan kasir cepat yang responsif:
  - Kolom pencarian barang instan (berdasarkan nama atau scan barcode).
  - Keranjang belanja (*Cart*) dengan pengaturan jumlah quantity, hapus item, dan subtotal real-time.
  - Opsi Nama Pelanggan: Opsional jika tunai biasa; Wajib diisi jika memilih metode pembayaran Bon/Tempo.
- Pilihan Metode Pembayaran:
  1. **Tunai (Cash)**: Input nominal bayar, kalkulasi uang kembalian otomatis.
  2. **Transfer Bank / QRIS**: Mencatat nomor referensi atau nama bank.
  3. **Bon / Hutang Pelanggan (Receivable)**: Otomatis membuat entitas Piutang baru dengan nominal sisa, status *UNPAID*, dan kolom tanggal jatuh tempo bon.
- Saat transaksi selesai:
  - Stok produk terpotong secara otomatis via database transaction (ACID).
  - Riwayat kartu stok bertambah dengan referensi nomor invoice.
  - Catatan arus kas masuk (*CashFlow INCOME*) bertambah otomatis untuk pembayaran tunai/transfer.
  - Tampilan ringkasan nota digital di layar kasir.

### 4.4. Modul Pembelian Barang Masuk (Kulakan dari Supplier)
- Form pencatatan pembelian stok dari distributor/supplier:
  - Nama Supplier / Distributor.
  - Nomor Faktur / Surat Jalan Supplier.
  - Pilihan barang dan jumlah yang masuk beserta harga beli per unit.
  - Metode Pembayaran: **Tunai/Lunas** (mengurangi kas toko) atau **Tempo/Hutang Supplier** (masuk ke modul Hutang Toko dengan tanggal jatuh tempo).
- Stok produk bertambah otomatis dan harga modal (HPP) diperbarui.

### 4.5. Modul Buku Kas & Arus Uang (Cash Flow & Profit)
- **Pencatatan Pengeluaran (Expense Entry)**:
  - Kategori: Biaya Listrik/Air/Internet, Gaji Pegawai, Bahan Bakar/Ongkos Angkut Pickup, Perlengkapan Toko, Pengeluaran Lain-lain.
  - Nominal dan catatan pendukung.
- **Rekap Keuangan Harian / Bulanan**:
  - Total Kas Masuk (Penjualan Tunai + Penerimaan Cicilan Bon).
  - Total Kas Keluar (Pengeluaran Operasional + Pembelian Stok Tunai + Bayar Hutang Supplier).
  - Saldo Kas Bersih (*Net Cash Flow*).
  - Estimasi Laba Kotor (*Gross Profit*): `Total Penjualan - Total HPP Barang Terjual`.

### 4.6. Modul Hutang & Piutang dengan Pengingat Jatuh Tempo (AP / AR Dashboard)
- Terbagi menjadi 2 tab utama:
  1. **Piutang Pelanggan (Receivables)**: Uang toko yang dibawa tukang/kontraktor/langganan.
  2. **Hutang ke Supplier (Payables)**: Tagihan kulakan dari distributor yang harus dibayar toko.
- **Kolom Data Tagihan**:
  - Nama Kontak (Tukang / Supplier) & No Telepon.
  - Tanggal Transaksi & Nomor Nota Referensi.
  - Total Tagihan, Total Terbayar, dan Sisa Tagihan.
  - Tanggal Jatuh Tempo.
  - Status: `BELUM_LUNAS`, `DICICIL` (Parsial), `LUNAS`.
- **Sistem Pengingat Visual (Due Date Reminder)**:
  - **Badge Merah ("Jatuh Tempo Hari Ini / Lewat Tempo")**: Ditampilkan jika tanggal hari ini $\ge$ tanggal jatuh tempo dan tagihan belum lunas.
  - **Badge Kuning ("Mendekati Tempo")**: Ditampilkan jika jatuh tempo dalam 1 - 3 hari ke depan.
  - **Badge Hijau ("Aman")**: Jatuh tempo lebih dari 3 hari ke depan atau sudah Lunas.
  - **Kartu Ringkasan Atas**:
    - Total Nominal Piutang Belum Lunas
    - Total Nominal Hutang Belum Lunas
    - Jumlah Tagihan Kritis (Jatuh Tempo Hari Ini / Lewat)
- **Pencatatan Pembayaran Cicilan**:
  - Modal input pembayaran: Nominal dicicil, tanggal pembayaran, metode (Tunai/Transfer), dan catatan.
  - Sisa tagihan berkurang otomatis; jika sisa = 0, status berubah menjadi `LUNAS`.
  - Pembayaran piutang otomatis menambah catatan Kas Masuk (`CashFlow INCOME`), sedangkan pembayaran hutang supplier otomatis mencatat Kas Keluar (`CashFlow EXPENSE`).

---

## 5. Arsitektur Teknis & Stack

- **Framework**: Next.js 14/15 (App Router, Server Actions untuk mutasi data, React Server Components untuk data fetching cepat).
- **Bahasa**: TypeScript (Full type safety dari database hingga form UI).
- **Database**: PostgreSQL.
- **ORM**: Prisma ORM (Schema-first modeling, declarative migrations, dan strongly-typed queries).
- **UI Component Library**: **shadcn/ui** dengan preset khusus: `--preset b1x9M8ZeJW` (perintah setup: `npx shadcn@latest init --preset b1x9M8ZeJW`), menyediakan koleksi komponen UI modern berbasis Radix UI & Tailwind CSS (Dialog/Modal, Table, Popover, Badge, Tabs, Card, Button, Input, DropdownMenu, Sheet).
- **Styling & Icons**: Tailwind CSS + Lucide React Icons (Interface clean, modern, kontras tinggi yang nyaman untuk pencahayaan toko).
- **Validasi Data**: Zod Schema validation di sisi server.
- **Manajemen State**: Server state melalui Next.js revalidation (`revalidatePath`).

---

## 6. Skema Database Lengkap (Prisma Schema Reference)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  OWNER
  CASHIER
}

enum PaymentType {
  CASH
  TRANSFER
  DEBT
}

enum MovementType {
  IN
  OUT
  ADJUSTMENT
}

enum DebtType {
  RECEIVABLE // Piutang (Pelanggan berhutang ke Toko)
  DEBT       // Hutang (Toko berhutang ke Supplier)
}

enum DebtStatus {
  UNPAID
  PARTIAL
  PAID
}

enum CashFlowType {
  INCOME
  EXPENSE
}

model User {
  id           String          @id @default(cuid())
  name         String
  username     String          @unique
  passwordHash String
  role         Role            @default(CASHIER)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  transactions Transaction[]
  movements    StockMovement[]
  cashFlows    CashFlow[]
}

model Product {
  id            String          @id @default(cuid())
  sku           String?         @unique
  name          String
  category      String
  unit          String          // Kaleng, Galon, Pail, Sak, Dus, Pcs, Meter
  purchasePrice Float           // Harga modal / HPP (Khusus Owner)
  sellingPrice  Float           // Harga jual eceran
  stock         Int             @default(0)
  minStockAlert Int             @default(5)
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  items         TransactionItem[]
  movements     StockMovement[]
}

model StockMovement {
  id          String       @id @default(cuid())
  productId   String
  product     Product      @relation(fields: [productId], references: [id])
  type        MovementType // IN, OUT, ADJUSTMENT
  quantity    Int
  stockBefore Int
  stockAfter  Int
  notes       String?
  referenceId String?      // ID Transaksi penjualan / ID Pembelian
  createdById String
  createdBy   User         @relation(fields: [createdById], references: [id])
  createdAt   DateTime     @default(now())
}

model Transaction {
  id             String            @id @default(cuid())
  invoiceNumber  String            @unique
  customerName   String?
  paymentType    PaymentType
  totalAmount    Float
  cashReceived   Float?
  changeAmount   Float?
  createdById    String
  createdBy      User              @relation(fields: [createdById], references: [id])
  createdAt      DateTime          @default(now())
  items          TransactionItem[]
  debtReceivable DebtReceivable?
}

model TransactionItem {
  id                String      @id @default(cuid())
  transactionId     String
  transaction       Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  productId         String
  product           Product     @relation(fields: [productId], references: [id])
  quantity          Int
  unitPrice         Float
  costPriceSnapshot Float       // Snapshot HPP saat transaksi terjadi
  subtotal          Float
}

model CashFlow {
  id          String       @id @default(cuid())
  type        CashFlowType // INCOME, EXPENSE
  category    String       // Penjualan, Operasional, Kulakan, Pelunasan
  amount      Float
  description String
  referenceId String?
  createdById String
  createdBy   User         @relation(fields: [createdById], references: [id])
  createdAt   DateTime     @default(now())
}

model DebtReceivable {
  id              String        @id @default(cuid())
  type            DebtType      // RECEIVABLE (Piutang) atau DEBT (Hutang Toko)
  contactName     String        // Nama Tukang / Nama Supplier
  contactPhone    String?
  transactionId   String?       @unique
  transaction     Transaction?  @relation(fields: [transactionId], references: [id])
  totalAmount     Float
  paidAmount      Float         @default(0)
  remainingAmount Float
  dueDate         DateTime
  status          DebtStatus    @default(UNPAID)
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  payments        DebtPayment[]
}

model DebtPayment {
  id               String         @id @default(cuid())
  debtReceivableId String
  debtReceivable   DebtReceivable @relation(fields: [debtReceivableId], references: [id], onDelete: Cascade)
  amount           Float
  paymentDate      DateTime       @default(now())
  paymentMethod    String         // Tunai / Transfer
  notes            String?
  createdAt        DateTime       @default(now())
}
```

---

## 7. Desain Alur Kerja & Keamanan

### 7.1. Alur Transaksi Kasir (Transaksi ACID)
Saat kasir mengonfirmasi transaksi:
1. `prisma.$transaction` dijalankan secara atomic.
2. Validasi stok: Pastikan stok tiap item di keranjang mencukupi.
3. Buat record `Transaction` dan `TransactionItem` (termasuk snapshot `costPriceSnapshot`).
4. Update `Product.stock` dan buat record `StockMovement` bertipe `OUT`.
5. Jika pembayaran Tunai/Transfer: Buat record `CashFlow` bertipe `INCOME`.
6. Jika pembayaran Bon (`DEBT`): Buat record `DebtReceivable` bertipe `RECEIVABLE` berstatus `UNPAID`.
7. Jika ada langkah yang gagal, semua perubahan di-*rollback* otomatis sehingga data stok dan uang tidak pernah selisih.

### 7.2. Logika Pengingat Jatuh Tempo (Due Date Logic)
Untuk setiap record `DebtReceivable` yang belum `PAID`:
- Hitung selisih hari: $\Delta t = \text{dueDate} - \text{today}$.
- Jika $\Delta t < 0$: Status **Lewat Jatuh Tempo** (Badge Merah tebal).
- Jika $\Delta t == 0$: Status **Jatuh Tempo Hari Ini** (Badge Merah).
- Jika $0 < \Delta t \le 3$: Status **Mendekati Tempo** (Badge Kuning).
- Jika $\Delta t > 3$: Status **Aman** (Badge Hijau/Netral).

---

## 8. Rencana Verifikasi & Pengujian
1. **Automated Tests**:
   - Unit & Integration Test untuk kalkulasi stok, potongan stok kasir, dan kalkulasi sisa hutang piutang.
   - Test integritas transaksi ACID (memastikan stok tidak berkurang jika transaksi dibatalkan).
2. **Manual Verification**:
   - Simulasi alur Kasir: Transaksi penjualan tunai vs bon pelanggan.
   - Verifikasi isolasi hak akses: Memastikan akun Kasir tidak dapat melihat harga modal (HPP) dan laporan laba kotor.
   - Verifikasi pengingat jatuh tempo: Menguji tagihan tanggal hari ini, lampau, dan masa depan untuk memastikan badge warna indikator akurat.
