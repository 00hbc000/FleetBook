"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type R = { id: number; vehicleId: number; startDate: string; endDate: string; status: string; totalPrice: string; createdAt: string };
type V = { id: number; brand: string; model: string; licensePlate: string; pricePerDay: string; category: string };

const STATUS_FR: Record<string, string> = { en_attente: "En attente", confirmee: "Confirmée", annulee: "Annulée", terminee: "Terminée" };

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [reservations, setReservations] = useState<R[]>([]);
  const [vehicles, setVehicles] = useState<Record<number, V>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) { router.push("/login"); return; }
      if (me.user.role === "admin") { router.push("/admin"); return; }
      setUser(me.user);
      const [rr, vv] = await Promise.all([
        fetch("/api/reservations").then((r) => r.json()),
        fetch("/api/vehicles").then((r) => r.json()),
      ]);
      setReservations(rr.reservations ?? []);
      const map: Record<number, V> = {};
      (vv.vehicles ?? []).forEach((v: V) => (map[v.id] = v));
      setVehicles(map);
    })();
  }, [router]);

  const cancel = async (id: number) => {
    if (!confirm("Annuler cette réservation ?")) return;
    const res = await fetch(`/api/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "annulee" }) });
    const j = await res.json();
    if (!res.ok) return setMsg(j.error);
    setReservations((p) => p.map((r) => (r.id === id ? { ...r, status: "annulee" } : r)));
    setMsg("Réservation annulée.");
  };

  const badge = (s: string) =>
    s === "confirmee" ? "bg-emerald-100 text-emerald-800"
    : s === "annulee" ? "bg-rose-100 text-rose-700"
    : s === "terminee" ? "bg-slate-200 text-slate-700"
    : "bg-amber-100 text-amber-800";

  const totalSpent = reservations.filter((r) => r.status !== "annulee").reduce((a, r) => a + Number(r.totalPrice), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Espace client</p>
          <h1 className="text-2xl font-black">Bonjour {user?.name ?? "..."} 👋</h1>
          <p className="text-sm text-slate-500">{reservations.length} réservation(s) · {totalSpent.toFixed(2)} € engagés (hors annulées)</p>
        </div>
        <Link href="/#catalogue" className="rounded-2xl bg-[#0b1e3a] px-5 py-2.5 text-sm font-bold text-white">+ Nouvelle réservation</Link>
      </div>
      {msg && <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 ring-1 ring-sky-200">{msg}</p>}
      <div className="mt-6 grid gap-4">
        {reservations.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200">
            <p className="text-4xl">🧾</p>
            <p className="mt-2 font-bold">Aucune réservation pour l&apos;instant</p>
            <p className="text-sm text-slate-500">Parcourez le catalogue et réservez votre premier véhicule.</p>
            <Link href="/" className="mt-4 inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-[#0b1e3a]">Voir le catalogue</Link>
          </div>
        )}
        {reservations.map((r) => {
          const v = vehicles[r.vehicleId];
          return (
            <div key={r.id} className="flex flex-col gap-3 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0b1e3a] text-2xl text-white">🚗</span>
                <div>
                  <p className="font-extrabold">#{r.id} · {v ? `${v.brand} ${v.model}` : `Véhicule ${r.vehicleId}`} <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${badge(r.status)}`}>{STATUS_FR[r.status] ?? r.status}</span></p>
                  <p className="text-sm text-slate-500">📅 {r.startDate} → {r.endDate} · {v?.licensePlate ?? ""} · {Number(r.totalPrice).toFixed(2)} €</p>
                </div>
              </div>
              <div className="flex gap-2">
                {v && <Link href={`/vehicles/${v.id}`} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold hover:bg-slate-200">Revoir</Link>}
                {r.status === "en_attente" && <button onClick={() => cancel(r.id)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500">Annuler</button>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
