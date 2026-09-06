"use client";

import { Role } from "@prisma/client";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { LogOut, User as UserIcon } from "lucide-react";

interface HeaderProps {
  user: {
    name: string;
    username: string;
    role: Role;
  };
}

export function Header({ user }: HeaderProps) {
  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={user.role} />
        <div className="hidden sm:block">
          <span className="text-xs text-muted-foreground capitalize">{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Role Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border bg-muted/40 text-xs">
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium hidden sm:inline">{user.name}</span>
          <Badge
            variant={user.role === Role.OWNER ? "default" : "success"}
            className="text-[10px] uppercase px-1.5 py-0 font-bold"
          >
            {user.role}
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
