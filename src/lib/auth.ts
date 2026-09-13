import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { PermissionAction, PermissionRecord, hasPermission } from "./permissions";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sumber-rejeki-pos-secret-jwt-token-key-2026-super-secure"
);

export const COOKIE_SESSION_NAME = "sr_pos_session";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  storeId?: string | null;
  storeName?: string | null;
  permissions: PermissionRecord[];
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
      roleId: payload.roleId as string,
      roleCode: payload.roleCode as string,
      roleName: payload.roleName as string,
      storeId: (payload.storeId as string) || null,
      storeName: (payload.storeName as string) || null,
      permissions: (payload.permissions as PermissionRecord[]) || [],
    };
  } catch {
    return null;
  }
}

export function userHasPermission(
  user: SessionUser,
  module: string,
  action: PermissionAction = "view"
): boolean {
  if (user.roleCode === "SUPERADMIN") return true;
  return hasPermission(user.permissions, module, action);
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

export async function requirePermission(
  module: string,
  action: PermissionAction = "view"
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (!userHasPermission(session, module, action)) {
    throw new Error("FORBIDDEN: Anda tidak memiliki izin untuk tindakan ini.");
  }

  return session;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.roleCode !== "SUPERADMIN") {
    throw new Error("FORBIDDEN: Halaman ini hanya dapat diakses oleh Super Admin");
  }

  return session;
}
