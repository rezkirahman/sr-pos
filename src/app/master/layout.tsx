import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import {
  LayoutDashboard,
  Store,
  Users,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.roleCode !== "SUPERADMIN") {
    redirect("/login");
  }

  const masterNav = [
    {
      title: "Ringkasan Platform",
      href: "/master",
      icon: LayoutDashboard,
    },
    {
      title: "Kelola Toko & UMKM",
      href: "/master/stores",
      icon: Store,
    },
    {
      title: "Kelola Semua Pengguna",
      href: "/master/users",
      icon: Users,
    },
    {
      title: "Atur Role & Izin (RBAC)",
      href: "/master/roles",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {/* Master Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card shrink-0">
        <div className="flex h-16 items-center gap-3 px-6 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="font-heading font-bold tracking-tight text-sm text-foreground">
              Master Control
            </div>
            <div className="text-[11px] text-muted-foreground">
              Super Admin Panel
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          {masterNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t">
            <Link
              href="/pos"
              className="flex items-center gap-2.5 rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Buka Tampilan POS Toko</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground">
          <div>Login sebagai:</div>
          <div className="font-semibold text-foreground">{session.name}</div>
          <div className="text-[10px] text-amber-600 font-mono font-bold mt-0.5">
            [SUPERADMIN]
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-foreground">
              Panel Pengendali Master
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <form action={logoutAction}>
              <Button
                variant="ghost"
                size="icon"
                rounded="full"
                type="submit"
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Keluar / Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
