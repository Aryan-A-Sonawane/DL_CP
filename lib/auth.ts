import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE_NAME = "frm_session";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type Role = "EMPLOYEE" | "DEPT_HEAD" | "ADMIN" | "SUPER_ADMIN";

export interface SessionPayload {
  uid: number;
  role: Role;
  orgId: number | null;
  iat: number;
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  // dev-only deterministic fallback so HMR doesn't invalidate sessions
  return "dev-only-frm-secret-change-me-please-32b";
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decodeSession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: Omit<SessionPayload, "iat">) {
  const token = encodeSession({ ...payload, iat: Math.floor(Date.now() / 1000) });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE_NAME)?.value);
}

export async function getCurrentUser() {
  const sess = await getSession();
  if (!sess) return null;
  const user = await prisma.user.findUnique({
    where: { id: sess.uid },
    include: { organization: true, department: true },
  });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError(401, "Not authenticated");
  }
  if (roles && !roles.includes(user.role as Role)) {
    throw new AuthError(403, "Forbidden");
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function generateInviteCode(): string {
  // 12-char human-readable upper-case code
  return randomBytes(9).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "X").slice(0, 12);
}

export function defaultDashboardPath(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super";
    case "ADMIN":
      return "/admin";
    case "DEPT_HEAD":
      return "/dept";
    case "EMPLOYEE":
    default:
      return "/employee";
  }
}
