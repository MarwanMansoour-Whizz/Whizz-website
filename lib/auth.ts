import { SignJWT, jwtVerify } from "jose";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/audit";

const SESSION_COOKIE = "whizz_session";
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-in-production"
);

export type Role = "admin" | "ziad" | "amira" | "may" | "maysara" | "heba";

const ENV_AUDIT_ROLES: Role[] = ["admin", "ziad", "heba"];

const ENV_MANAGE_USERS: Role[] = ["admin", "ziad"];

export interface SessionPayload {
  user: string;
  role: string;
  canAccessDashboard: boolean;
  canManageUsers: boolean;
  exp: number;
}

export function canAccessAudit(session: SessionPayload): boolean {
  return session.canAccessDashboard === true;
}

/** User can manage users (list, create, delete, set password, toggle dashboard/users access). */
export function canManageUsers(session: SessionPayload): boolean {
  return session.canManageUsers === true;
}

export async function createSession(
  username: string,
  canAccessDashboard: boolean,
  canManageUsers: boolean
): Promise<string> {
  const token = await new SignJWT({
    user: username,
    role: username,
    canAccessDashboard,
    canManageUsers,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SECRET);
  return token;
}

export async function getSessionFromToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.user !== "string" || typeof payload.role !== "string") {
      return null;
    }
    const canAccessDashboard =
      payload.canAccessDashboard === true ||
      (payload.canAccessDashboard === undefined &&
        ENV_AUDIT_ROLES.includes(payload.role as Role));
    const canManageUsers =
      payload.canManageUsers === true ||
      (payload.canManageUsers === undefined &&
        ENV_MANAGE_USERS.includes(payload.role as Role));
    return {
      user: payload.user,
      role: payload.role,
      canAccessDashboard: !!canAccessDashboard,
      canManageUsers: !!canManageUsers,
      exp: (payload.exp as number) ?? 0,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

function getEnvHash(role: Role): string | null {
  const raw =
    role === "admin"
      ? process.env.ADMIN_PASSWORD_HASH
      : role === "ziad"
        ? process.env.ZIAD_PASSWORD_HASH
        : role === "amira"
          ? process.env.AMIRA_PASSWORD_HASH
          : role === "may"
            ? process.env.MAY_PASSWORD_HASH
            : role === "maysara"
              ? process.env.MAYSARA_PASSWORD_HASH
              : role === "heba"
                ? process.env.HEBA_PASSWORD_HASH
                : undefined;
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("$2")) return trimmed;
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (decoded.startsWith("$2")) return decoded;
  } catch {
    /* ignore */
  }
  return trimmed;
}

export interface VerifyResult {
  username: string;
  canAccessDashboard: boolean;
  canManageUsers: boolean;
}

/** Verify credentials. Tries DB first, then env fallback. */
export async function verifyUser(
  username: string,
  password: string
): Promise<VerifyResult | null> {
  const lower = username.trim().toLowerCase();
  const dbUser = await prisma.user.findUnique({
    where: { username: lower },
  }).catch(() => null);
  if (dbUser) {
    const ok = await compare(password, dbUser.passwordHash);
    if (!ok) return null;
    return {
      username: dbUser.username,
      canAccessDashboard: dbUser.canAccessDashboard,
      canManageUsers: dbUser.canManageUsers,
    };
  }
  const role = lower as Role;
  if (!["admin", "ziad", "amira", "may", "maysara", "heba"].includes(role)) {
    return null;
  }
  const hash = getEnvHash(role);
  if (!hash) return null;
  const ok = await compare(password, hash);
  if (!ok) return null;
  return {
    username: role,
    canAccessDashboard: ENV_AUDIT_ROLES.includes(role),
    canManageUsers: ENV_MANAGE_USERS.includes(role),
  };
}

/** For login route: check if user can log in (exists in DB or has env hash). Throws if DB is unreachable. */
export async function isPasswordConfigured(username: string): Promise<boolean> {
  const lower = username.trim().toLowerCase();
  let dbUser: { username: string } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { username: lower },
      select: { username: true },
    });
  } catch (e) {
    throw new Error(
      "Database unreachable. Check that DATABASE_URL is set in your hosting environment (e.g. Netlify → Site configuration → Environment variables) and points to your Neon database."
    );
  }
  if (dbUser) return true;
  const role = lower as Role;
  if (!["admin", "ziad", "amira", "may", "maysara", "heba"].includes(role)) {
    return false;
  }
  return getEnvHash(role) !== null;
}
