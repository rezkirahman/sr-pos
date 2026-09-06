import { getSession } from "@/lib/auth";
import { getProducts } from "@/actions/product";
import { getDebtsSummary } from "@/actions/debt";
import { getCashFlowSummary } from "@/actions/cashflow";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { FinancialSummary } from "@/components/cashflow/financial-summary";
import { DebtSummaryCards } from "@/components/debts/debt-summary-cards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import { ShoppingCart, Boxes, Receipt, AlertTriangle, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== Role.OWNER) {
    redirect("/pos");
  }

  const [cashSummary, debtSummary, allProducts] = await Promise.all([
    getCashFlowSummary(),
    getDebtsSummary(),
    getProducts(),
  ]);

  const lowStockProducts = allProducts.filter(
    (p) => p.stock <= p.minStockAlert
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-muted/40 border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Selamat Datang, {session.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Berikut adalah ringkasan performa penjualan, ketersediaan stok cat, dan arus keuangan toko hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pos">
            <Button size="sm" className="h-9 gap-1.5 font-semibold text-xs shadow">
              <ShoppingCart className="h-4 w-4" /> Buka Kasir POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial Health Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Ringkasan Arus Keuangan & Laba</h2>
          <Link
            href="/cashflow"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Buku Kas Lengkap <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <FinancialSummary summary={cashSummary} />
      </div>

      {/* Debt & Receivable Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Status Hutang & Piutang</h2>
          <Link
            href="/debts"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Detail Tagihan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <DebtSummaryCards
          totalReceivables={debtSummary.totalReceivables}
          totalPayables={debtSummary.totalPayables}
          criticalCount={debtSummary.criticalCount}
          isOwner={true}
        />
      </div>

      {/* Quick Alerts: Low Stock warning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Warning Card */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-bold">
                Peringatan Stok Menipis & Habis ({lowStockProducts.length})
              </CardTitle>
            </div>
            <Link
              href="/inventory"
              className="text-xs text-primary font-medium hover:underline"
            >
              Kelola Stok
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                Semua stok barang dalam kondisi aman.
              </div>
            ) : (
              lowStockProducts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg border bg-muted/20"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Batas Min: {p.minStockAlert} {p.unit}
                    </div>
                  </div>
                  <Badge
                    variant={p.stock <= 0 ? "danger" : "warning"}
                    className="shrink-0 font-bold"
                  >
                    Sisa: {p.stock} {p.unit}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Operations Shortcuts */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold">Akses Operasional Cepat</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              href="/pos"
              className="p-3.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-xs">Kasir POS</div>
                <div className="text-[11px] text-muted-foreground">Input penjualan toko</div>
              </div>
            </Link>

            <Link
              href="/purchases"
              className="p-3.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shadow">
                <Boxes className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-xs">Kulakan Supplier</div>
                <div className="text-[11px] text-muted-foreground">Catat faktur masuk</div>
              </div>
            </Link>

            <Link
              href="/debts"
              className="p-3.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white shadow">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-xs">Tagihan & Bon</div>
                <div className="text-[11px] text-muted-foreground">Catat pelunasan</div>
              </div>
            </Link>

            <Link
              href="/inventory"
              className="p-3.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shadow">
                <Boxes className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-xs">Stock Opname</div>
                <div className="text-[11px] text-muted-foreground">Penyesuaian fisik</div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
