"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type V = {
  id: number; brand: string; model: string; year: number; licensePlate: string;
  category: string; seats: number; transmission: string; fuel: string;
  pricePerDay: string; status: string; description?: string | null;
};

export default function VehicleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [v, setV] = useState<V | null>(null);
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`).then((r) => r.json()).then((j) => setV(j.vehicle ?? null));
  }, [id]);

  const days = start && end ? Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1) : 0;
  const total = v ? (Number(v.pricePerDay) * days).toFixed(2) : "0";

  const book = async () => {
    setMsg(""); setOk(false); setLoading(true);
    const res = await fetch("/api/reservations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: Number(id), startDate: start, endDate: end }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) { router.push("/login"); return; }
      return setMsg(j.error || "Erreur");
    }
    setOk(true);
    setMsg(`Réservation #${j.reservation.id} créée : ${days} jour(s) — ${j.reservation.totalPrice} €. Statut : en attente.`);
  };

  if (!v) return <main className="mx-auto max-w-4xl px-4 py-10"><p className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">Chargement du véhicule...</p></main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm font-bold text-blue-700 hover:underline">← Retour au catalogue</Link>
      <div className="mt-3 grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
          <div className="bg-gradient-to-br from-slate-900 via-[#0b1e3a] to-sky-800 p-8 text-white">
            <p className="text-7xl">🚗</p>
            <h1 className="mt-4 text-3xl font-black">{v.brand} {v.model}</h1>
            <p className="font-mono text-sm text-sky-200">{v.licensePlate} · {v.year} · {v.category}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {[`${v.seats} places`, v.transmission, v.fuel, v.status].map((s) => (
                <span key={s} className="rounded-full bg-white/15 px-3 py-1 font-bold">{s}</span>
              ))}
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-extrabold">Description</h3>
            <p className="mt-1 text-sm text-slate-600">{v.description || "Véhicule fictif pour TP DevSecOps — entretenu, assuré, disponible au départ de l'agence."}</p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
              <p className="font-bold">🛡️ Garanties incluses</p>
              <ul className="mt-1 text-slate-600"><li>• Assurance tous risques</li><li>• Kilométrage illimité</li><li>• Annulation gratuite 48h avant</li></ul>
            </div>
          </div>
        </div>
        <div className="h-fit rounded-3xl bg-white p-6 ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Votre réservation</p>
          <p className="mt-1"><span className="text-3xl font-black">{Number(v.pricePerDay).toFixed(0)} €</span><span className="text-sm text-slate-500"> / jour</span></p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">Début<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-100 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-amber-400" /></label>
            <label className="text-sm font-bold">Fin<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-100 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-amber-400" /></label>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#0b1e3a] p-4 text-white">
            <span className="text-sm">{days} jour(s)</span>
            <span className="text-xl font-black text-amber-300">{total} €</span>
          </div>
          {msg && <p className={`mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${ok ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"}`}>{msg}</p>}
          {ok && <Link href="/dashboard" className="mt-2 block text-center text-sm font-bold text-blue-700 hover:underline">Voir mes réservations →</Link>}
          <button onClick={book} disabled={loading || v.status === "maintenance"} className="mt-4 w-full rounded-2xl bg-amber-400 py-3 font-extrabold text-[#0b1e3a] hover:bg-amber-300 disabled:opacity-50">
            {loading ? "Réservation..." : v.status === "maintenance" ? "Indisponible (maintenance)" : "Confirmer la réservation →"}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">Paiement à l&apos;agence · Annulation gratuite jusqu&apos;à 48h avant</p>
        </div>
      </div>
    </main>
  );
}
