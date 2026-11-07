import { NextResponse } from 'next/server';
import { db } from '@/db';
import { reservations } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';

// La note appartient à la réservation de l'utilisateur connecté.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { note } = await req.json();
  const { id } = await ctx.params;
  if (typeof note !== 'string' || note.length > 2000) return NextResponse.json({ error: 'Note invalide' }, { status: 400 });
  const rows = await db.update(reservations).set({ note })
    .where(and(eq(reservations.id, Number(id)), eq(reservations.userId, session.id)))
    .returning({ id: reservations.id, note: reservations.note });
  if (!rows[0]) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
