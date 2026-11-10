import { NextResponse } from "next/server";
import { getUserByEmail, verifyPassword, signToken, safeLog, AUTH_COOKIE } from "@/lib/auth";
import { tooManyAttempts, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }
    // Limitation des tentatives par adresse IP (fenetre de 15 minutes).
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (tooManyAttempts(ip)) {
      return NextResponse.json({ error: "Trop de tentatives, patientez avant de recommencer" }, { status: 429 });
    }
    const user = await getUserByEmail(String(email));
    if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
      recordFailedAttempt(ip);
      safeLog("login_failed", { email: String(email).slice(0, 3) + "***" });
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }
    const session = { id: user.id, name: user.name, email: user.email, role: user.role as "admin" | "user" };
    clearAttempts(ip);
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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
