import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sumber-rejeki-pos-secret-jwt-token-key-2026-super-secure"
);

const COOKIE_SESSION_NAME = "sr_pos_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore internal assets & api
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_SESSION_NAME)?.value;
  let session: {
    id: string;
    name: string;
    username: string;
    roleCode: string;
    permissions?: Array<{ module: string; canView: boolean }>;
  } | null = null;

  let isLegacyToken = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (!payload.roleCode || !payload.roleId) {
        // Token lama sebelum update RBAC
        isLegacyToken = true;
        session = null;
      } else {
        session = payload as any;
      }
    } catch {
      session = null;
    }
  }

  if (isLegacyToken) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(COOKIE_SESSION_NAME);
    return res;
  }

  const getDefaultRedirect = () => {
    if (!session) return "/login";
    if (session.roleCode === "SUPERADMIN") return "/master";
    const canViewDashboard = session.permissions?.some(
      (p) => p.module === "dashboard" && p.canView
    );
    return canViewDashboard ? "/dashboard" : "/pos";
  };

  // Handle Root Path /
  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL(getDefaultRedirect(), request.url));
  }

  // If on login page
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(getDefaultRedirect(), request.url));
    }
    return NextResponse.next();
  }

  // Protected pages: if not logged in, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Guard Master-only pages (/master/*)
  if (pathname.startsWith("/master")) {
    if (session.roleCode !== "SUPERADMIN") {
      return NextResponse.redirect(new URL(getDefaultRedirect(), request.url));
    }
    return NextResponse.next();
  }

  // If Superadmin visits store routes, let them through
  if (session.roleCode === "SUPERADMIN") {
    return NextResponse.next();
  }

  // Map module to path prefixes
  const modulePathMap: Record<string, string> = {
    "/dashboard": "dashboard",
    "/pos": "pos",
    "/inventory": "inventory",
    "/purchases": "purchases",
    "/debts": "debts",
    "/cashflow": "cashflow",
    "/users": "users",
  };

  for (const [prefix, moduleName] of Object.entries(modulePathMap)) {
    if (pathname.startsWith(prefix)) {
      const perm = session.permissions?.find((p) => p.module === moduleName);
      if (!perm?.canView) {
        return NextResponse.redirect(new URL(getDefaultRedirect(), request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
