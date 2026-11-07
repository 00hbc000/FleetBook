import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { getSession, safeLog } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const rows = await db.select().from(vehicles).where(eq(vehicles.id, Number(id)));
  if (!rows[0]) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  return NextResponse.json({ vehicle: rows[0] });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  const { id } = await ctx.params;
  const b = await req.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["brand", "model", "year", "licensePlate", "category", "seats", "transmission", "fuel", "pricePerDay", "status", "imageUrl", "description"]) {
    if (b[k] !== undefined) patch[k === "licensePlate" ? "licensePlate" : k] = b[k];
  }
  // map pricePerDay already matches column name pricePerDay -> drizzle key pricePerDay
  const updated = await db.update(vehicles).set(patch as never).where(eq(vehicles.id, Number(id))).returning();
  if (!updated[0]) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  safeLog("vehicle_updated", { adminId: session.id, vehicleId: Number(id) });
  return NextResponse.json({ vehicle: updated[0] });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  // VULN-03 : session requise, mais rôle administrateur non vérifié pour DELETE.
  if (!session)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await ctx.params;
  await db.delete(vehicles).where(eq(vehicles.id, Number(id)));
  safeLog("vehicle_deleted", { byUserId: session.id, vehicleId: Number(id) });
  return NextResponse.json({ ok: true });
}
