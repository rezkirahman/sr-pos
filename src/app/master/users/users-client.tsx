"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { masterResetUserPassword, masterUpdateUserRole, masterDeleteUser } from "@/actions/master";
import { Key, UserCheck, Trash2, ShieldAlert, User, Store, Loader2, CheckCircle2 } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  username: string;
  createdAt: Date;
  store: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  } | null;
  role: {
    id: string;
    name: string;
    code: string;
  };
}

interface UsersClientProps {
  initialUsers: UserItem[];
  stores: Array<{ id: string; name: string; code: string }>;
  roles: Array<{ id: string; name: string; code: string }>;
}

export function MasterUsersClient({ initialUsers, stores, roles }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("ALL");

  // Reset Password Dialog State
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Change Role Dialog State
  const [roleUser, setRoleUser] = useState<UserItem | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  const filteredUsers = selectedStoreFilter === "ALL"
    ? users
    : users.filter((u) => u.store?.id === selectedStoreFilter);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      await masterResetUserPassword(resetUser.id, newPassword);
      setResetSuccess(`Password untuk user "${resetUser.username}" berhasil diubah menjadi: "${newPassword}"`);
      setTimeout(() => {
        setResetUser(null);
        setNewPassword("");
        setResetSuccess(null);
      }, 2500);
    } catch (err: any) {
      setResetError(err.message || "Gagal mereset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleChangeRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleUser || !selectedRoleId) return;

    setRoleLoading(true);
    try {
      await masterUpdateUserRole(roleUser.id, selectedRoleId);
      setRoleUser(null);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah role user.");
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteUser = async (u: UserItem) => {
    if (!confirm(`Yakin ingin menghapus akun "${u.name}" (@${u.username})?`)) return;

    try {
      await masterDeleteUser(u.id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus user.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Kelola Semua Pengguna (Lintas Toko)
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Pantau seluruh staf & pemilik toko, ubah role, dan ganti password siapa pun secara langsung.
          </p>
        </div>

        {/* Store Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-muted-foreground">Filter Toko:</span>
          <select
            className="h-9 px-3 rounded-lg border border-input bg-card text-xs sm:text-sm font-medium shadow-xs"
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value)}
          >
            <option value="ALL">Semua Toko ({users.length} User)</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.code}] {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Nama Pengguna</TableHead>
              <TableHead className="font-semibold">Username Login</TableHead>
              <TableHead className="font-semibold">Toko / UMKM</TableHead>
              <TableHead className="font-semibold">Role Aktif</TableHead>
              <TableHead className="text-right font-semibold">Aksi Cepat Master</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Tidak ada pengguna ditemukan pada filter ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const isSuperAdmin = u.role.code === "SUPERADMIN";

                return (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isSuperAdmin ? (
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{u.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-foreground font-semibold">
                      {u.username}
                    </TableCell>

                    <TableCell>
                      {u.store ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Store className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{u.store.name}</span>
                          <span className="text-muted-foreground font-mono">({u.store.code})</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                          Bebas Toko (Platform)
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={isSuperAdmin ? "destructive" : u.role.code === "OWNER" ? "default" : "secondary"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {u.role.name}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct Password Reset Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          onClick={() => {
                            setResetUser(u);
                            setNewPassword("");
                            setResetSuccess(null);
                            setResetError(null);
                          }}
                          title="Ganti password langsung"
                        >
                          <Key className="h-3.5 w-3.5" /> Ganti Password
                        </Button>

                        {/* Change Role Button */}
                        {!isSuperAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1"
                            onClick={() => {
                              setRoleUser(u);
                              setSelectedRoleId(u.role.id);
                            }}
                            title="Ubah role pengguna"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Ubah Role
                          </Button>
                        )}

                        {/* Delete User */}
                        {!isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteUser(u)}
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Ganti Password Langsung */}
      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Ganti Password Langsung
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground">
              Sebagai Super Admin, Anda dapat mengganti password untuk pengguna:
              <br />
              <strong className="text-foreground">{resetUser?.name}</strong> (@{resetUser?.username})
              tanpa memerlukan verifikasi password lama.
            </p>

            {resetError && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 text-xs bg-green-500/15 text-green-700 dark:text-green-400 rounded-md font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Password Baru
              </label>
              <Input
                placeholder="Ketikkan password baru..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
              <span className="text-[11px] text-muted-foreground block mt-1">
                Minimal 5 karakter. Setelah disimpan, user dapat langsung login dengan password ini.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetUser(null)}
                disabled={resetLoading}
              >
                Tutup
              </Button>
              <Button
                type="submit"
                disabled={resetLoading || !newPassword}
                className="font-semibold bg-amber-500 hover:bg-amber-600 text-white"
              >
                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Password Baru
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah Role */}
      <Dialog open={!!roleUser} onOpenChange={(open) => !open && setRoleUser(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold">
              Ubah Role Pengguna
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleChangeRoleSubmit} className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground">
              Pilih role baru untuk <strong className="text-foreground">{roleUser?.name}</strong>:
            </p>

            <div>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoleUser(null)}
                disabled={roleLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={roleLoading} className="font-semibold">
                {roleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Terapkan Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
