import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Users, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MasterDashboardPage() {
  const session = await getSession();
  if (!session || session.roleCode !== "SUPERADMIN") {
    redirect("/login");
  }

  const [storesCount, usersCount, rolesCount, productsCount] = await Promise.all([
    prisma.store.count(),
    prisma.user.count(),
    prisma.role.count(),
    prisma.product.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-background to-muted border shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Selamat Datang di Master Control
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
          Pusat kendali seluruh ekosistem POS Multi-Tenant. Anda memiliki wewenang penuh untuk
          mengatur seluruh toko, membuat role dinamis, dan mengelola akun pengguna lintas toko.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Toko / UMKM
            </CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storesCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Toko terdaftar di platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Pengguna
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Akun owner, kasir, dan staf</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Role & Hak Akses
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rolesCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Role dinamis terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Master Produk
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Akumulasi seluruh katalog toko</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Kelola Toko & UMKM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Tambah toko baru secara instan, perbarui profil toko, atau nonaktifkan toko yang berhenti langganan.
            </p>
            <Link href="/master/stores">
              <Button size="sm" variant="outline" className="w-full gap-1.5 font-semibold text-xs">
                Buka Manajemen Toko <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Kelola Pengguna & Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Lihat seluruh pengguna, ganti password pengguna secara langsung jika lupa password, dan atur role.
            </p>
            <Link href="/master/users">
              <Button size="sm" variant="outline" className="w-full gap-1.5 font-semibold text-xs">
                Buka Manajemen Pengguna <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Atur Role & Perizinan (RBAC)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Buat role baru (misal: Admin Gudang, Supervisor) dan atur centang izin View, Tambah, Edit, dan Hapus per fitur.
            </p>
            <Link href="/master/roles">
              <Button size="sm" variant="outline" className="w-full gap-1.5 font-semibold text-xs">
                Buka Pengaturan Role <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
