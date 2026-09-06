import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sumber-rejeki-pos-secret-jwt-token-key-2026-super-secure"
);

const COOKIE_SESSION_NAME = "sr_pos_session";

const OWNER_ONLY_PATHS = [
  "/dashboard",
  "/purchases",
  "/cashflow",
  "/users",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore internal assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_SESSION_NAME)?.value;
  let session = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as { id: string; name: string; username: string; role: string };
    } catch {
      session = null;
    }
  }

  // Handle Root Path /
  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const target = session.role === "OWNER" ? "/dashboard" : "/pos";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // If on login page
  if (pathname === "/login") {
    if (session) {
      const target = session.role === "OWNER" ? "/dashboard" : "/pos";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // Protected pages: if not logged in, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Guard Owner-only pages
  if (session.role !== "OWNER") {
    const isOwnerOnly = OWNER_ONLY_PATHS.some((path) => pathname.startsWith(path));
    if (isOwnerOnly) {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
