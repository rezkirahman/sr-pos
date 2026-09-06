"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { getDueDateStatus } from "@/lib/due-date";
import { PaymentDialog } from "./payment-dialog";
import { CreditCard, History, ChevronDown, ChevronUp } from "lucide-react";

interface DebtTableProps {
  debts: any[];
  onRefresh: () => void;
}

export function DebtTable({ debts, onRefresh }: DebtTableProps) {
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (debts.length === 0) {
    return (
      <div className="p-10 text-center border rounded-xl bg-card text-muted-foreground text-sm">
        Tidak ada data tagihan yang tercatat pada kategori ini.
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Kontak / Nama</TableHead>
              <TableHead>No. Nota / Faktur</TableHead>
              <TableHead className="text-right">Total Tagihan</TableHead>
              <TableHead className="text-right">Terbayar</TableHead>
              <TableHead className="text-right">Sisa Tagihan</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead className="text-center">Indikator Tempo</TableHead>
              <TableHead className="text-right w-[140px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debts.map((d) => {
              const isPaid = d.status === "PAID" || d.remainingAmount === 0;
              const dueInfo = getDueDateStatus(new Date(d.dueDate), isPaid);
              const isExpanded = expandedId === d.id;

              return (
                <React.Fragment key={d.id}>
                  <TableRow className={dueInfo.status === "OVERDUE" ? "bg-destructive/5" : ""}>
                    <TableCell className="font-semibold text-xs sm:text-sm">
                      <div>{d.contactName}</div>
                      {d.contactPhone && (
                        <div className="text-[11px] text-muted-foreground font-normal">
                          {d.contactPhone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.transaction?.invoiceNumber || d.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatRupiah(d.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-600">
                      {formatRupiah(d.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs sm:text-sm text-destructive">
                      {formatRupiah(d.remainingAmount)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(d.dueDate))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={dueInfo.badgeVariant}
                        className="text-[10px] font-bold tracking-tight px-2 py-0.5"
                      >
                        {dueInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isPaid && (
                          <Button
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1 font-semibold"
                            onClick={() => setSelectedDebtForPayment(d)}
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Bayar
                          </Button>
                        )}
                        {d.payments?.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            title="Lihat Riwayat Cicilan"
                            onClick={() => toggleExpand(d.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Installment Payments History */}
                  {isExpanded && d.payments?.length > 0 && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={8} className="p-4">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                          <History className="h-3.5 w-3.5" /> Riwayat Cicilan Masuk:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {d.payments.map((p: any) => (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-lg border bg-background text-xs space-y-1"
                            >
                              <div className="flex justify-between font-bold">
                                <span>{formatRupiah(p.amount)}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {p.paymentMethod}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {new Intl.DateTimeFormat("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(p.paymentDate))}
                              </div>
                              {p.notes && (
                                <div className="text-[11px] text-muted-foreground italic">
                                  &ldquo;{p.notes}&rdquo;
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {debts.map((d) => {
          const isPaid = d.status === "PAID" || d.remainingAmount === 0;
          const dueInfo = getDueDateStatus(new Date(d.dueDate), isPaid);
          const isExpanded = expandedId === d.id;

          return (
            <div
              key={d.id}
              className={`p-4 rounded-xl border bg-card shadow-sm space-y-3 ${
                dueInfo.status === "OVERDUE" ? "border-l-4 border-l-destructive" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-foreground">{d.contactName}</div>
                  {d.contactPhone && (
                    <div className="text-xs text-muted-foreground">{d.contactPhone}</div>
                  )}
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {d.transaction?.invoiceNumber || d.notes || "-"}
                  </div>
                </div>
                <Badge
                  variant={dueInfo.badgeVariant}
                  className="text-[10px] font-bold shrink-0"
                >
                  {dueInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 border-y py-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground">Total Tagihan</div>
                  <div className="font-mono font-semibold">{formatRupiah(d.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Terbayar</div>
                  <div className="font-mono font-semibold text-emerald-600">
                    {formatRupiah(d.paidAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Sisa Tagihan</div>
                  <div className="font-mono font-bold text-destructive">
                    {formatRupiah(d.remainingAmount)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-muted-foreground">
                  Tempo:{" "}
                  <strong>
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(d.dueDate))}
                  </strong>
                </span>

                <div className="flex items-center gap-1.5">
                  {d.payments?.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => toggleExpand(d.id)}
                    >
                      {d.payments.length} Cicilan
                    </Button>
                  )}
                  {!isPaid && (
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs gap-1 font-semibold"
                      onClick={() => setSelectedDebtForPayment(d)}
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Bayar
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile Expanded Installments */}
              {isExpanded && d.payments?.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/30 border space-y-2 mt-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <History className="h-3.5 w-3.5" /> Riwayat Cicilan ({d.payments.length})
                  </div>
                  {d.payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-xs border-b last:border-0 pb-1"
                    >
                      <div>
                        <span className="font-bold">{formatRupiah(p.amount)}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({p.paymentMethod})
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(p.paymentDate))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Dialog Modal */}
      <PaymentDialog
        open={!!selectedDebtForPayment}
        onOpenChange={(open) => !open && setSelectedDebtForPayment(null)}
        debt={selectedDebtForPayment}
        onSuccess={onRefresh}
      />
    </>
  );
}
