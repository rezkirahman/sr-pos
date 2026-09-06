"use client";

import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role } from "@prisma/client";
import { createUser } from "@/actions/user";
import { Loader2 } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, onSuccess }: UserDialogProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.CASHIER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password,
        role,
      });

      setName("");
      setUsername("");
      setPassword("");
      setRole(Role.CASHIER);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Gagal membuat pengguna baru");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">
            Tambah Pengguna Baru
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
              Nama Lengkap
            </label>
            <Input
              placeholder="cth: Siti Rahma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Username (Login)
            </label>
            <Input
              placeholder="cth: sitikasir"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Hak Akses / Peran (Role)
            </label>
            <select
              className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs sm:text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value={Role.CASHIER}>KASIR (Hanya Akses POS & Lihat Stok)</option>
              <option value={Role.OWNER}>PEMILIK TOKO (Akses Penuh Seluruh Sistem)</option>
            </select>
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
              Simpan Akun
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
