import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, vehicles, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  }
  const [vehCount] = await db.select({ c: sql<number>`count(*)` }).from(vehicles);
  const [resCount] = await db.select({ c: sql<number>`count(*)` }).from(reservations);
  const [userCount] = await db.select({ c: sql<number>`count(*)` }).from(users);
  const [revenue] = await db
    .select({ total: sql<string>`coalesce(sum(total_price),0)` })
    .from(reservations);
  const byStatus = await db
    .select({ status: reservations.status, c: sql<number>`count(*)` })
    .from(reservations)
    .groupBy(reservations.status);
  const recent = await db.select().from(reservations).orderBy(sql`created_at desc`).limit(8);
  return NextResponse.json({
    stats: {
      vehicles: Number(vehCount.c),
      reservations: Number(resCount.c),
      users: Number(userCount.c),
      revenue: String(revenue.total),
      byStatus,
      recent,
    },
  });
}
