"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface CashFlowTableProps {
  entries: any[];
}

export function CashFlowTable({ entries }: CashFlowTableProps) {
  if (entries.length === 0) {
    return (
      <div className="p-10 text-center border rounded-xl bg-card text-muted-foreground text-sm">
        Belum ada catatan mutasi kas pada periode ini.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-[140px]">Tanggal & Waktu</TableHead>
            <TableHead className="w-[110px]">Tipe Kas</TableHead>
            <TableHead className="w-[180px]">Kategori</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead className="text-right">Nominal</TableHead>
            <TableHead className="text-right w-[140px]">Petugas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((item) => {
            const isIncome = item.type === "INCOME";

            return (
              <TableRow key={item.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(item.createdAt))}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isIncome ? "success" : "danger"}
                    className="text-[10px] font-bold gap-1 px-1.5 py-0"
                  >
                    {isIncome ? (
                      <>
                        <ArrowDownRight className="h-3 w-3" /> MASUK
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-3 w-3" /> KELUAR
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-xs">
                  {item.category}
                </TableCell>
                <TableCell className="text-xs text-foreground">
                  <div>{item.description}</div>
                  {item.referenceId && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Ref: {item.referenceId}
                    </div>
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-mono font-bold text-xs sm:text-sm ${
                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  }`}
                >
                  {isIncome ? `+${formatRupiah(item.amount)}` : `-${formatRupiah(item.amount)}`}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {item.createdBy?.name || "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
