import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sumber-rejeki-pos-secret-jwt-token-key-2026-super-secure"
);

export const COOKIE_SESSION_NAME = "sr_pos_session";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  storeId: string;
  storeName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      username: payload.username as string,
      role: payload.role as Role,
      storeId: payload.storeId as string,
      storeName: payload.storeName as string,
    };
  } catch {
    return null;
  }
}

export function hasRoleAccess(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export async function createSession(user: SessionUser) {
  const token = await signSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_SESSION_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_SESSION_NAME);
  } catch {
    // Cookie store might not be available in non-request contexts
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (!hasRoleAccess(session.role, allowedRoles)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
