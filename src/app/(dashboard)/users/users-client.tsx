"use client";

import { useState } from "react";
import { UserDialog } from "@/components/users/user-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUsers, deleteUser } from "@/actions/user";
import { UserPlus, Key, Trash2, ShieldCheck, User as UserIcon } from "lucide-react";

interface UsersClientProps {
  initialUsers: any[];
  currentUserId: string;
  roles?: any[];
}

export function UsersClient({ initialUsers, currentUserId, roles = [] }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus akun "${name}"?`)) return;

    try {
      await deleteUser(id);
      refreshUsers();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus user");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Kelola Pengguna Sistem
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Atur akun kasir toko dan staf sistem dengan pemisahan hak akses aman.
          </p>
        </div>

        <Button
          onClick={() => setOpenAddDialog(true)}
          className="gap-2 font-semibold self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" /> Tambah Staf Baru
        </Button>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Nama Staf</TableHead>
              <TableHead className="font-semibold">Username</TableHead>
              <TableHead className="font-semibold">Role / Hak Akses</TableHead>
              <TableHead className="font-semibold">Dibuat Pada</TableHead>
              <TableHead className="text-right font-semibold">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada akun staf terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUserId;
                const isOwner = u.role?.code === "OWNER";

                return (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            (Akun Anda)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.username}</TableCell>
                    <TableCell>
                      <Badge
                        variant={isOwner ? "default" : "secondary"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {u.role?.name || "Staf"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(u.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs gap-1"
                          onClick={() => setSelectedUserForReset(u)}
                          title="Reset Password"
                        >
                          <Key className="h-3.5 w-3.5" /> Reset
                        </Button>

                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(u.id, u.name)}
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

      <UserDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        onSuccess={refreshUsers}
        roles={roles}
      />

      <ResetPasswordDialog
        open={!!selectedUserForReset}
        onOpenChange={(open) => !open && setSelectedUserForReset(null)}
        user={selectedUserForReset}
        onSuccess={() => {
          setSelectedUserForReset(null);
          refreshUsers();
        }}
      />
    </div>
  );
}
