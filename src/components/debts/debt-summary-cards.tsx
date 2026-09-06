"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, AlertCircle } from "lucide-react";

interface DebtSummaryCardsProps {
  totalReceivables: number;
  totalPayables: number;
  criticalCount: number;
  isOwner: boolean;
}

export function DebtSummaryCards({
  totalReceivables,
  totalPayables,
  criticalCount,
  isOwner,
}: DebtSummaryCardsProps) {
  return (
    <div className={`grid grid-cols-1 ${isOwner ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3.5`}>
      {/* Piutang Pelanggan */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Piutang Pelanggan (Bon Toko)
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {formatRupiah(totalReceivables)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Total uang toko yang masih belum dilunasi pelanggan/tukang
          </p>
        </CardContent>
      </Card>

      {/* Hutang ke Supplier (Khusus Owner) */}
      {isOwner && (
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hutang Toko ke Supplier
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
              {formatRupiah(totalPayables)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kewajiban tagihan faktur kulakan yang harus dibayar toko
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tagihan Kritis */}
      <Card className="border-l-4 border-l-destructive shadow-sm">
        <CardHeader className="p-4 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tagihan Kritis (Jatuh Tempo)
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="text-xl sm:text-2xl font-bold text-destructive font-mono">
            {criticalCount} Tagihan
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Jatuh tempo hari ini atau telah melewati batas waktu
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
