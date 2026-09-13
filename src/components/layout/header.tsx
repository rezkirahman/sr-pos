"use client";

import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { LogOut, User as UserIcon, Store as StoreIcon, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { SessionUser } from "@/lib/auth";

interface HeaderProps {
  user: SessionUser;
}

export function Header({ user }: HeaderProps) {
  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const isSuperAdmin = user.roleCode === "SUPERADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav
          permissions={user.permissions}
          roleCode={user.roleCode}
          roleName={user.roleName}
        />

        {/* Active Store Badge or Super Admin indicator */}
        {user.storeName ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-primary/10 text-primary font-semibold text-xs shadow-xs">
            <StoreIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[220px]">{user.storeName}</span>
          </div>
        ) : isSuperAdmin ? (
          <Link
            href="/master"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs"
          >
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>Mode Super Admin</span>
          </Link>
        ) : null}

        <div className="hidden lg:block">
          <span className="text-xs text-muted-foreground capitalize">{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Role Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border bg-muted/40 text-xs">
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium hidden sm:inline">{user.name}</span>
          <Badge
            variant={isSuperAdmin ? "destructive" : user.roleCode === "OWNER" ? "default" : "secondary"}
            className="text-[10px] uppercase px-1.5 py-0 font-bold"
          >
            {user.roleName || user.roleCode}
          </Badge>
        </div>

        {/* Theme Toggler */}
        <ThemeToggle />

        {/* Logout Button */}
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
  );
}
