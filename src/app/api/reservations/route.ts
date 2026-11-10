import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, vehicles } from "@/db/schema";
import { getSession, safeLog } from "@/lib/auth";
import { eq, and, desc, gte, lte, or } from "drizzle-orm";

function daysBetween(a: string, b: string) {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (session.role === "admin") {
    const rows = await db.select().from(reservations).orderBy(desc(reservations.createdAt)).limit(200);
    return NextResponse.json({ reservations: rows });
  }
  const rows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.userId, session.id))
    .orderBy(desc(reservations.createdAt));
  return NextResponse.json({ reservations: rows });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Connectez-vous pour réserver" }, { status: 401 });
  try {
    const { vehicleId, startDate, endDate } = await req.json();
    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json({ error: "Véhicule, date début et fin requis" }, { status: 400 });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
    }
    if (new Date(startDate) < new Date(new Date().toISOString().slice(0, 10))) {
      return NextResponse.json({ error: "La date de début ne peut pas être dans le passé" }, { status: 400 });
    }
    const vRows = await db.select().from(vehicles).where(eq(vehicles.id, Number(vehicleId)));
    const vehicle = vRows[0];
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
    if (vehicle.status === "maintenance") {
      return NextResponse.json({ error: "Véhicule en maintenance, non réservable" }, { status: 409 });
    }
    // Overlap check: existing non-cancelled reservations overlapping
    const overlapping = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.vehicleId, Number(vehicleId)),
          or(eq(reservations.status, "en_attente"), eq(reservations.status, "confirmee"))!,
          lte(reservations.startDate, String(endDate)),
          gte(reservations.endDate, String(startDate))
        )
      );
    if (overlapping.length > 0) {
      return NextResponse.json({ error: "Véhicule déjà réservé sur cette période" }, { status: 409 });
    }
    const days = daysBetween(String(startDate), String(endDate));
    const total = (Number(vehicle.pricePerDay) * days).toFixed(2);
    const inserted = await db
      .insert(reservations)
      .values({
        userId: session.id,
        vehicleId: Number(vehicleId),
        startDate: String(startDate),
        endDate: String(endDate),
        status: "en_attente",
        totalPrice: total,
      })
      .returning();
    safeLog("reservation_created", { userId: session.id, vehicleId: Number(vehicleId), days });
    return NextResponse.json({ reservation: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
