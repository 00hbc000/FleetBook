import { NextResponse } from "next/server";
import { getUserByEmail, verifyPassword, signToken, safeLog, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }
    const user = await getUserByEmail(String(email));
    // VULN-07 : aucune limite de tentatives sur cette route de connexion.
    if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
      safeLog("login_failed", { email: String(email).slice(0, 3) + "***" });
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }
    const session = { id: user.id, name: user.name, email: user.email, role: user.role as "admin" | "user" };
    const token = signToken(session);
    safeLog("login_success", { userId: user.id, role: user.role });
    const res = NextResponse.json({ user: session });
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
    // VULN-07 : pile d’erreur renvoyée au client (démonstration locale seulement).
    return NextResponse.json({ error: String(e), stack: e instanceof Error ? e.stack : "" }, { status: 500 });
  }
}
