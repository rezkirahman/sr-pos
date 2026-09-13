"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  TrendingUp,
  Users,
  Paintbrush,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  permissions?: Array<{ module: string; canView: boolean }>;
  roleCode?: string;
  roleName?: string;
}

const ALL_NAV_ITEMS = [
  {
    module: "dashboard",
    title: "Ringkasan Toko",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    module: "pos",
    title: "Kasir (POS)",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    module: "inventory",
    title: "Master Produk & Stok",
    href: "/inventory",
    icon: Boxes,
  },
  {
    module: "purchases",
    title: "Kulakan Distributor",
    href: "/purchases",
    icon: Truck,
  },
  {
    module: "debts",
    title: "Hutang & Piutang",
    href: "/debts",
    icon: Receipt,
  },
  {
    module: "cashflow",
    title: "Buku Kas & Laba",
    href: "/cashflow",
    icon: TrendingUp,
  },
  {
    module: "users",
    title: "Kelola Staf Toko",
    href: "/users",
    icon: Users,
  },
];

export function Sidebar({ permissions = [], roleCode = "", roleName = "" }: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = roleCode === "SUPERADMIN";

  const navItems = isSuperAdmin
    ? ALL_NAV_ITEMS
    : ALL_NAV_ITEMS.filter((item) =>
        permissions.some((p) => p.module === item.module && p.canView)
      );

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card shrink-0">
      <div className="flex h-16 items-center gap-3 px-6 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Paintbrush className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-heading font-bold tracking-tight text-sm truncate">
            POS Cat & Bangunan
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            Multi-Tenant System
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        {isSuperAdmin && (
          <div className="mb-3 pb-3 border-b">
            <Link
              href="/master"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Dashboard Master</span>
            </Link>
          </div>
        )}

        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t text-[11px] text-muted-foreground">
        <div>Role: <strong className="text-foreground">{roleName || roleCode || "Pengguna"}</strong></div>
      </div>
    </aside>
  );
}
