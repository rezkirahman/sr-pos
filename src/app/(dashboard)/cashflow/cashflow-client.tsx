"use client";

import { useState } from "react";
import { FinancialSummary } from "@/components/cashflow/financial-summary";
import { CashFlowTable } from "@/components/cashflow/cashflow-table";
import { ExpenseDialog } from "@/components/cashflow/expense-dialog";
import { Button } from "@/components/ui/button";
import { getCashFlowSummary, getCashFlowLedger } from "@/actions/cashflow";
import { Plus, RefreshCw, Calendar } from "lucide-react";

interface CashFlowClientProps {
  initialSummary: any;
  initialLedger: any[];
}

export function CashFlowClient({
  initialSummary,
  initialLedger,
}: CashFlowClientProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [ledger, setLedger] = useState(initialLedger);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("all");

  const filterByRange = async (range: "today" | "week" | "month" | "all") => {
    setDateRange(range);
    setLoading(true);

    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    const now = new Date();
    if (range === "today") {
      startDate = now.toISOString().split("T")[0];
      endDate = startDate;
    } else if (range === "week") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      startDate = past.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
    } else if (range === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = firstDay.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
    }

    try {
      const [sum, led] = await Promise.all([
        getCashFlowSummary(startDate, endDate),
        getCashFlowLedger(startDate, endDate),
      ]);
      setSummary(sum);
      setLedger(led);
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
            Buku Kas & Laporan Laba Kotor Toko
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Pantau arus kas masuk, pengeluaran operasional toko, kulakan suplier, dan estimasi keuntungan kotor.
          </p>
        </div>

        <Button
          onClick={() => setOpenExpenseDialog(true)}
          className="self-start sm:self-auto gap-1.5 font-semibold text-xs h-9 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Catat Pengeluaran Baru
        </Button>
      </div>

      {/* Date Range Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl border bg-card">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-2">
          <Calendar className="h-4 w-4" /> Filter Periode:
        </div>

        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant={dateRange === "today" ? "default" : "ghost"}
            className="text-xs h-8 px-3 rounded-lg"
            onClick={() => filterByRange("today")}
          >
            Hari Ini
          </Button>
          <Button
            type="button"
            size="sm"
            variant={dateRange === "week" ? "default" : "ghost"}
            className="text-xs h-8 px-3 rounded-lg"
            onClick={() => filterByRange("week")}
          >
            7 Hari Terakhir
          </Button>
          <Button
            type="button"
            size="sm"
            variant={dateRange === "month" ? "default" : "ghost"}
            className="text-xs h-8 px-3 rounded-lg"
            onClick={() => filterByRange("month")}
          >
            Bulan Ini
          </Button>
          <Button
            type="button"
            size="sm"
            variant={dateRange === "all" ? "default" : "ghost"}
            className="text-xs h-8 px-3 rounded-lg"
            onClick={() => filterByRange("all")}
          >
            Semua Data
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 ml-auto"
          onClick={() => filterByRange(dateRange)}
          disabled={loading}
          title="Refresh Data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 4 Financial Cards */}
      <FinancialSummary summary={summary} />

      {/* Ledger Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Buku Catatan Arus Kas (Mutasi)</h2>
          <span className="text-xs text-muted-foreground">{ledger.length} transaksi tercatat</span>
        </div>
        <CashFlowTable entries={ledger} />
      </div>

      {/* Expense Modal */}
      <ExpenseDialog
        open={openExpenseDialog}
        onOpenChange={setOpenExpenseDialog}
        onSuccess={() => filterByRange(dateRange)}
      />
    </div>
  );
}
