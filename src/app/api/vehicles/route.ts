import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { getSession, safeLog } from "@/lib/auth";
import { eq, and, or, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category") ?? "";
    const status = searchParams.get("status") ?? "";

    let rows;
    const filters = [];
    if (q) {
      // Recherche sécurisée : critère lié par Drizzle (ilike), aucune concaténation.
      const like = `%${q}%`;
      filters.push(or(ilike(vehicles.brand, like), ilike(vehicles.model, like)));
    }
    if (category) filters.push(eq(vehicles.category, category));
    if (status) filters.push(eq(vehicles.status, status as "disponible" | "loue" | "maintenance"));

    if (filters.length > 0) {
      rows = await db.select().from(vehicles).where(and(...filters));
    } else {
      rows = await db.select().from(vehicles);
    }
    return NextResponse.json({ vehicles: rows });
  } catch (e) {
    // VULN-07 : message détaillé et pile exposés au client local.
    return NextResponse.json({ error: String(e), stack: e instanceof Error ? e.stack : '' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  }
  try {
    const b = await req.json();
    const required = ["brand", "model", "year", "licensePlate", "pricePerDay"];
    for (const f of required) {
      if (!b[f]) return NextResponse.json({ error: `Champ requis: ${f}` }, { status: 400 });
    }
    const inserted = await db
      .insert(vehicles)
      .values({
        brand: String(b.brand).slice(0, 80),
        model: String(b.model).slice(0, 80),
        year: Number(b.year),
        licensePlate: String(b.licensePlate).toUpperCase().slice(0, 20),
        category: String(b.category || "Berline").slice(0, 60),
        seats: Number(b.seats || 5),
        transmission: String(b.transmission || "Automatique").slice(0, 20),
        fuel: String(b.fuel || "Diesel").slice(0, 20),
        pricePerDay: String(b.pricePerDay),
        status: (b.status as "disponible" | "loue" | "maintenance") || "disponible",
        imageUrl: b.imageUrl ? String(b.imageUrl).slice(0, 500) : null,
        description: b.description ? String(b.description).slice(0, 2000) : null,
      })
      .returning();
    safeLog("vehicle_created", { adminId: session.id, vehicleId: inserted[0].id });
    return NextResponse.json({ vehicle: inserted[0] }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Immatriculation déjà existante" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
