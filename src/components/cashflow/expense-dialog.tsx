"use client";

import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { expenseCategories } from "@/lib/validations/cashflow";
import { createExpense } from "@/actions/cashflow";
import { Loader2 } from "lucide-react";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExpenseDialog({ open, onOpenChange, onSuccess }: ExpenseDialogProps) {
  const [category, setCategory] = useState<string>(expenseCategories[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = Number(amount || 0);
    if (val <= 0) {
      setError("Nominal pengeluaran harus lebih besar dari Rp 0.");
      return;
    }

    setLoading(true);

    try {
      await createExpense({
        category,
        amount: val,
        description: description.trim(),
        expenseDate,
      });

      setAmount("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal mencatat pengeluaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">
            Catat Pengeluaran Kas Toko (Expense)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Kategori Pengeluaran
            </label>
            <select
              className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs sm:text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Nominal (Rp)
              </label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-base font-bold"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tanggal Pengeluaran
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Keterangan / Keperluan Pengeluaran
            </label>
            <Input
              placeholder="cth: Bayar token listrik PLN toko 200rb / bensin pickup"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="font-semibold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Pengeluaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
