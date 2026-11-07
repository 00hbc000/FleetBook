import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { getSession, safeLog } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await ctx.params;
  const { status } = await req.json();
  const allowed = ["en_attente", "confirmee", "annulee", "terminee"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  // Users can only cancel their own; admin can do everything
  if (session.role !== "admin") {
    if (status !== "annulee") {
      return NextResponse.json({ error: "Vous pouvez uniquement annuler vos réservations" }, { status: 403 });
    }
    const own = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, Number(id)), eq(reservations.userId, session.id)));
    if (!own[0]) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  const updated = await db
    .update(reservations)
    .set({ status: status as "en_attente" | "confirmee" | "annulee" | "terminee" })
    .where(eq(reservations.id, Number(id)))
    .returning();
  if (!updated[0]) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  safeLog("reservation_status", { by: session.id, id: Number(id), status });
  return NextResponse.json({ reservation: updated[0] });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await ctx.params;
  if (session.role !== "admin") {
    const own = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, Number(id)), eq(reservations.userId, session.id)));
    if (!own[0]) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }
  await db.update(reservations).set({ status: "annulee" }).where(eq(reservations.id, Number(id)));
  safeLog("reservation_cancelled", { by: session.id, id: Number(id) });
  return NextResponse.json({ ok: true });
}
