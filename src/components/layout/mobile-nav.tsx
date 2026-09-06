"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
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
  role: Role;
}

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
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
              <SheetTitle className="text-base font-bold">Sumber Rejeki</SheetTitle>
              <div className="text-xs text-muted-foreground">Toko Cat & Bangunan</div>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground">
          <div>Role Aktif: <strong className="text-foreground">{role}</strong></div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
