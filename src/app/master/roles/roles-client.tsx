"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MODULE_DEFINITIONS, AppModule, PermissionAction } from "@/lib/permissions";
import { createCustomRole, updateCustomRole, deleteCustomRole } from "@/actions/master";
import { Plus, Edit2, Trash2, ShieldCheck, ShieldAlert, Loader2, Check } from "lucide-react";

interface RolePermissionItem {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  permissions: RolePermissionItem[];
  _count: {
    users: number;
  };
}

interface RolesClientProps {
  initialRoles: RoleItem[];
}

export function RolesClient({ initialRoles }: RolesClientProps) {
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionsState, setPermissionsState] = useState<Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }>>({});

  const openCreateDialog = () => {
    setEditingRole(null);
    setName("");
    setDescription("");

    // Initialize all modules as false
    const initialPerms: Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }> = {};
    for (const def of MODULE_DEFINITIONS) {
      initialPerms[def.module] = { view: false, create: false, update: false, delete: false };
    }
    setPermissionsState(initialPerms);
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (role: RoleItem) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");

    const currentPerms: Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }> = {};
    for (const def of MODULE_DEFINITIONS) {
      const existing = role.permissions.find((p) => p.module === def.module);
      currentPerms[def.module] = {
        view: !!existing?.canView,
        create: !!existing?.canCreate,
        update: !!existing?.canUpdate,
        delete: !!existing?.canDelete,
      };
    }
    setPermissionsState(currentPerms);
    setError(null);
    setDialogOpen(true);
  };

  const togglePermission = (module: string, action: "view" | "create" | "update" | "delete") => {
    setPermissionsState((prev) => {
      const current = prev[module] || { view: false, create: false, update: false, delete: false };
      const nextVal = !current[action];

      // Auto-enable view if create/update/delete is checked
      let nextView = current.view;
      if ((action === "create" || action === "update" || action === "delete") && nextVal) {
        nextView = true;
      }
      // If unchecking view, uncheck all others
      if (action === "view" && !nextVal) {
        return {
          ...prev,
          [module]: { view: false, create: false, update: false, delete: false },
        };
      }

      return {
        ...prev,
        [module]: {
          ...current,
          view: nextView,
          [action]: nextVal,
        },
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama role wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    const formattedPermissions = Object.entries(permissionsState).map(([module, perms]) => ({
      module,
      canView: perms.view,
      canCreate: perms.create,
      canUpdate: perms.update,
      canDelete: perms.delete,
    }));

    try {
      if (editingRole) {
        await updateCustomRole(editingRole.id, {
          name,
          description,
          permissions: formattedPermissions,
        });
      } else {
        await createCustomRole({
          name,
          description,
          permissions: formattedPermissions,
        });
      }

      setDialogOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan role");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role: RoleItem) => {
    if (!confirm(`Yakin ingin menghapus role "${role.name}"?`)) return;

    try {
      await deleteCustomRole(role.id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Atur Role & Hak Akses (RBAC)
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Buat nama role baru dan tentukan hak akses fitur secara granular (Lihat, Tambah, Edit, Hapus).
          </p>
        </div>

        <Button onClick={openCreateDialog} className="gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Tambah Role Baru
        </Button>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Nama Role</TableHead>
              <TableHead className="font-semibold">Kode Sistem</TableHead>
              <TableHead className="font-semibold">Deskripsi</TableHead>
              <TableHead className="font-semibold">Hak Akses Modul Aktif</TableHead>
              <TableHead className="font-semibold">Jumlah Staf</TableHead>
              <TableHead className="text-right font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => {
              const activeModules = r.permissions
                .filter((p) => p.canView)
                .map((p) => p.module);

              return (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      {r.isSystem ? (
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      )}
                      <span>{r.name}</span>
                      {r.isSystem && (
                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 text-amber-600 border-amber-500/30">
                          Bawaan
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.code}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {r.description || "-"}
                  </TableCell>
                  <TableCell>
                    {r.code === "SUPERADMIN" ? (
                      <Badge className="bg-amber-500 text-white font-bold text-[10px]">
                        Semua Fitur (Master)
                      </Badge>
                    ) : activeModules.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Tidak ada akses</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {activeModules.map((m) => (
                          <Badge key={m} variant="secondary" className="text-[10px] capitalize">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {r._count.users} pengguna
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.code !== "SUPERADMIN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs gap-1"
                          onClick={() => openEditDialog(r)}
                        >
                          <Edit2 className="h-3 w-3" /> Edit Izin
                        </Button>
                      )}

                      {!r.isSystem && r._count.users === 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(r)}
                          title="Hapus Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Form Role & Permissions Matrix */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold">
              {editingRole ? `Edit Hak Akses: ${editingRole.name}` : "Buat Role Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-1">
            {error && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Nama Role
                </label>
                <Input
                  placeholder="cth: Admin Gudang"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Keterangan / Deskripsi
                </label>
                <Input
                  placeholder="cth: Staf khusus stok dan kulakan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Granular Permission Matrix Table */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                Matriks Hak Akses Modul (Granular Permissions)
              </label>

              <div className="border rounded-xl overflow-hidden bg-card text-xs">
                <Table>
                  <TableHeader className="bg-muted/60">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground">Modul / Fitur</TableHead>
                      <TableHead className="text-center font-semibold w-16">Lihat</TableHead>
                      <TableHead className="text-center font-semibold w-16">Tambah</TableHead>
                      <TableHead className="text-center font-semibold w-16">Edit</TableHead>
                      <TableHead className="text-center font-semibold w-16">Hapus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULE_DEFINITIONS.map((def) => {
                      const perms = permissionsState[def.module] || {
                        view: false,
                        create: false,
                        update: false,
                        delete: false,
                      };

                      const hasView = def.actions.includes("view");
                      const hasCreate = def.actions.includes("create");
                      const hasUpdate = def.actions.includes("update");
                      const hasDelete = def.actions.includes("delete");

                      return (
                        <TableRow key={def.module}>
                          <TableCell className="py-2.5">
                            <div className="font-semibold text-foreground">{def.label}</div>
                            <div className="text-[11px] text-muted-foreground">{def.description}</div>
                          </TableCell>

                          {/* View */}
                          <TableCell className="text-center">
                            {hasView ? (
                              <input
                                type="checkbox"
                                checked={perms.view}
                                onChange={() => togglePermission(def.module, "view")}
                                className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* Create */}
                          <TableCell className="text-center">
                            {hasCreate ? (
                              <input
                                type="checkbox"
                                checked={perms.create}
                                onChange={() => togglePermission(def.module, "create")}
                                className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* Update */}
                          <TableCell className="text-center">
                            {hasUpdate ? (
                              <input
                                type="checkbox"
                                checked={perms.update}
                                onChange={() => togglePermission(def.module, "update")}
                                className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>

                          {/* Delete */}
                          <TableCell className="text-center">
                            {hasDelete ? (
                              <input
                                type="checkbox"
                                checked={perms.delete}
                                onChange={() => togglePermission(def.module, "delete")}
                                className="h-4 w-4 rounded border-input text-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
                Simpan Konfigurasi Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
