"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileNavProps {
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

export function MobileNav({ permissions = [], roleCode = "", roleName = "" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isSuperAdmin = roleCode === "SUPERADMIN";

  const navItems = isSuperAdmin
    ? ALL_NAV_ITEMS
    : ALL_NAV_ITEMS.filter((item) =>
        permissions.some((p) => p.module === item.module && p.canView)
      );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" rounded="full" className="md:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-5 border-b text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Paintbrush className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="font-heading text-base font-bold">POS Cat Bangunan</SheetTitle>
              <div className="text-xs text-muted-foreground">Multi-Tenant System</div>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {isSuperAdmin && (
            <div className="mb-2 pb-2 border-b">
              <Link
                href="/master"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-bold text-primary bg-primary/10"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Dashboard Master</span>
              </Link>
            </div>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground">
          <div>Role Aktif: <strong className="text-foreground">{roleName || roleCode || "Pengguna"}</strong></div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
