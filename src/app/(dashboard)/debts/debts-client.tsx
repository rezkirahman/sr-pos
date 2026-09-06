"use client";

import { useState } from "react";
import { DebtSummaryCards } from "@/components/debts/debt-summary-cards";
import { DebtTable } from "@/components/debts/debt-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getDebts, getDebtsSummary } from "@/actions/debt";
import { DebtType } from "@prisma/client";
import { RefreshCw, Receipt, Truck } from "lucide-react";

interface DebtsClientProps {
  summary: {
    totalReceivables: number;
    totalPayables: number;
    criticalCount: number;
  };
  initialReceivables: any[];
  initialPayables: any[];
  isOwner: boolean;
}

export function DebtsClient({
  summary: initialSummary,
  initialReceivables,
  initialPayables,
  isOwner,
}: DebtsClientProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [receivables, setReceivables] = useState(initialReceivables);
  const [payables, setPayables] = useState(initialPayables);
  const [currentTab, setCurrentTab] = useState<string>("receivables");
  const [loading, setLoading] = useState(false);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [sum, rec, pay] = await Promise.all([
        getDebtsSummary(),
        getDebts(DebtType.RECEIVABLE),
        isOwner ? getDebts(DebtType.DEBT) : Promise.resolve([]),
      ]);
      setSummary(sum);
      setReceivables(rec);
      setPayables(pay);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            {isOwner ? "Monitoring Hutang & Piutang Toko" : "Buku Bon (Piutang Pelanggan)"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Lacak bon tempo pelanggan dan tagihan suplier dengan sistem indikator visual jatuh tempo.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          disabled={loading}
          className="self-start sm:self-auto gap-1.5 text-xs h-9"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Metric Cards */}
      <DebtSummaryCards
        totalReceivables={summary.totalReceivables}
        totalPayables={summary.totalPayables}
        criticalCount={summary.criticalCount}
        isOwner={isOwner}
      />

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        {isOwner && (
          <TabsList className="grid grid-cols-2 max-w-md h-10">
            <TabsTrigger value="receivables" className="text-xs font-semibold gap-1.5">
              <Receipt className="h-4 w-4" /> Piutang Pelanggan ({receivables.length})
            </TabsTrigger>
            <TabsTrigger value="payables" className="text-xs font-semibold gap-1.5">
              <Truck className="h-4 w-4" /> Hutang ke Supplier ({payables.length})
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="receivables" className="space-y-3 m-0">
          <div className="text-xs text-muted-foreground">
            Daftar bon belanja pelanggan/tukang yang belum lunas atau masih dalam masa pembayaran.
          </div>
          <DebtTable debts={receivables} onRefresh={refreshAll} />
        </TabsContent>

        {isOwner && (
          <TabsContent value="payables" className="space-y-3 m-0">
            <div className="text-xs text-muted-foreground">
              Daftar kewajiban pembayaran tagihan faktur distributor/supplier toko.
            </div>
            <DebtTable debts={payables} onRefresh={refreshAll} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
