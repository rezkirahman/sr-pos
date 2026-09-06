"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  TrendingUp,
  Users,
  Paintbrush,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    ...(role === Role.OWNER
      ? [
          {
            title: "Ringkasan Toko",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
        ]
      : []),
    {
      title: "Kasir (POS)",
      href: "/pos",
      icon: ShoppingCart,
    },
    {
      title: role === Role.OWNER ? "Master Produk & Stok" : "Katalog & Stok Barang",
      href: "/inventory",
      icon: Boxes,
    },
    ...(role === Role.OWNER
      ? [
          {
            title: "Kulakan Distributor",
            href: "/purchases",
            icon: Truck,
          },
        ]
      : []),
    {
      title: role === Role.OWNER ? "Hutang & Piutang" : "Buku Bon (Piutang)",
      href: "/debts",
      icon: Receipt,
    },
    ...(role === Role.OWNER
      ? [
          {
            title: "Buku Kas & Laba",
            href: "/cashflow",
            icon: TrendingUp,
          },
          {
            title: "Kelola Pengguna",
            href: "/users",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card/60 backdrop-blur shrink-0 min-h-screen">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
          <Paintbrush className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight leading-none">
            Sumber Rejeki
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Toko Cat & Bangunan
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs text-muted-foreground">
        <div>Hak Akses: <strong className="text-foreground">{role}</strong></div>
        <div className="text-[10px] mt-0.5 text-muted-foreground/70">v1.0.0 • Sumber Rejeki POS</div>
      </div>
    </aside>
  );
}
