"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp } from "lucide-react";

interface FinancialSummaryProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    grossProfit: number;
  };
}

export function FinancialSummary({ summary }: FinancialSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Kas Masuk */}
      <Card className="border-l-4 border-l-emerald-500 shadow-sm">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Kas Masuk
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-emerald-500" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatRupiah(summary.totalIncome)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Penjualan tunai/transfer & cicilan bon
          </p>
        </CardContent>
      </Card>

      {/* Kas Keluar */}
      <Card className="border-l-4 border-l-destructive shadow-sm">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Kas Keluar
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-xl sm:text-2xl font-bold font-mono text-destructive">
            {formatRupiah(summary.totalExpense)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Operasional, kulakan tunai & cicilan hutang
          </p>
        </CardContent>
      </Card>

      {/* Saldo Kas Bersih */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Saldo Kas Bersih
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {formatRupiah(summary.netCashFlow)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Selisih arus kas masuk & kas keluar
          </p>
        </CardContent>
      </Card>

      {/* Estimasi Laba Kotor */}
      <Card className="border-l-4 border-l-amber-500 shadow-sm">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estimasi Laba Kotor
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatRupiah(summary.grossProfit)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Total omzet dikurangi HPP modal barang
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
