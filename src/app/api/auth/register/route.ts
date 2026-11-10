import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, signToken, getUserByEmail, safeLog, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body ?? {};
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nom, email et mot de passe requis" }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Mot de passe : 6 caractères minimum" }, { status: 400 });
    }
    const existing = await getUserByEmail(String(email));
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }
    // L’inscription publique ne doit jamais attribuer le rôle administrateur.
    const safeRole = "user";
    const passwordHash = await hashPassword(String(password));
    const inserted = await db
      .insert(users)
      .values({
        name: String(name).slice(0, 120),
        email: String(email).toLowerCase().slice(0, 180),
        passwordHash,
        role: safeRole,
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
    const u = inserted[0];
    const token = signToken({ id: u.id, name: u.name, email: u.email, role: u.role as "admin" | "user" });
    safeLog("user_register", { userId: u.id, role: u.role });
    const res = NextResponse.json({ user: u }, { status: 201 });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
