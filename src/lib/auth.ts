import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db, pool } from "@/db";
import { getJwtSecret } from "@/lib/training-config";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "fleetbook_token";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession() {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  return rows[0] ?? null;
}

// VULN-01 : concaténation SQL sur l'email de connexion, uniquement pour le TP.
export async function getUserByEmailUnsafe(email: string) {
  const result = await pool.query(
    'SELECT id, name, email, role, password_hash AS "passwordHash" FROM users WHERE email = \'' + email.toLowerCase() + '\' LIMIT 1'
  );
  return result.rows[0] as (typeof users.$inferSelect | undefined);
}

export const AUTH_COOKIE = COOKIE_NAME;

// Sanitized logging — never log secrets / passwords / tokens
export function safeLog(event: string, meta: Record<string, unknown> = {}) {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (/pass|secret|token|hash/i.test(k)) continue;
    clean[k] = v;
  }
  console.log(JSON.stringify({ service: "fleetbook-backend", event, ...clean, ts: new Date().toISOString() }));
}
