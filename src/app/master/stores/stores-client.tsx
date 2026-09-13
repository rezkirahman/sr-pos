"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createMasterStore, updateMasterStore } from "@/actions/master";
import { Store, Plus, Power, Users, Boxes, Receipt, Loader2, Phone, MapPin } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  _count: {
    users: number;
    products: number;
    transactions: number;
  };
}

interface StoresClientProps {
  initialStores: StoreItem[];
}

export function MasterStoresClient({ initialStores }: StoresClientProps) {
  const [stores, setStores] = useState<StoreItem[]>(initialStores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [storeName, setStoreName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  const openCreateDialog = () => {
    setStoreName("");
    setStoreCode(`TK0${stores.length + 1}`);
    setAddress("");
    setPhone("");
    setOwnerName("");
    setOwnerUsername("");
    setOwnerPassword("");
    setError(null);
    setDialogOpen(true);
  };

  const handleCreateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createMasterStore({
        name: storeName,
        code: storeCode,
        address,
        phone,
        ownerName,
        ownerUsername,
        ownerPassword,
      });

      setDialogOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Gagal membuat toko baru");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (s: StoreItem) => {
    const actionText = s.isActive ? "menonaktifkan" : "mengaktifkan";
    if (!confirm(`Yakin ingin ${actionText} toko "${s.name}"?`)) return;

    try {
      await updateMasterStore(s.id, { isActive: !s.isActive });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status toko.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Kelola Toko & UMKM (Tenants)
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Daftar seluruh toko terdaftar di sistem. Anda dapat menambah toko baru atau menonaktifkan toko.
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Tambah Toko Baru
        </Button>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Kode</TableHead>
              <TableHead className="font-semibold">Nama Toko & Kontak</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Statistik Toko</TableHead>
              <TableHead className="text-right font-semibold">Aksi Master</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs font-bold text-foreground">
                  {s.code}
                </TableCell>

                <TableCell>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    <span>{s.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {s.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[240px]">{s.address}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={s.isActive ? "default" : "destructive"}
                    className="text-[10px] uppercase font-bold"
                  >
                    {s.isActive ? "Aktif" : "Non-Aktif"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1" title="Jumlah Pengguna">
                      <Users className="h-3.5 w-3.5" /> {s._count.users} user
                    </span>
                    <span className="flex items-center gap-1" title="Katalog Produk">
                      <Boxes className="h-3.5 w-3.5" /> {s._count.products} produk
                    </span>
                    <span className="flex items-center gap-1" title="Total Transaksi">
                      <Receipt className="h-3.5 w-3.5" /> {s._count.transactions} trx
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant={s.isActive ? "outline" : "default"}
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1.5 font-medium"
                    onClick={() => handleToggleActive(s)}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{s.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Tambah Toko Baru */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Tambah Toko & Akun Pemilik
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStoreSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Informasi Toko
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Kode Toko
                  </label>
                  <Input
                    placeholder="TK06"
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Nama Toko / UMKM
                  </label>
                  <Input
                    placeholder="cth: TB Sinar Jaya"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    No Telepon (Opsional)
                  </label>
                  <Input
                    placeholder="0812-xxxx-xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Alamat (Opsional)
                  </label>
                  <Input
                    placeholder="Jl. Raya No. 12"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Akun Pemilik (Owner) Awal
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nama Pemilik
                </label>
                <Input
                  placeholder="cth: Budi Setiawan"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Username Login
                  </label>
                  <Input
                    placeholder="cth: owner_sinarjaya"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value.toLowerCase())}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Password Awal
                  </label>
                  <Input
                    type="password"
                    placeholder="Min 6 karakter"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="font-semibold">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Toko Baru
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
