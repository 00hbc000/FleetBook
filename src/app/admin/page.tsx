"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type V = {
  id: number; brand: string; model: string; year: number; licensePlate: string;
  category: string; seats: number; transmission: string; fuel: string;
  pricePerDay: string; status: string; description?: string | null;
};
type R = { id: number; userId: number; vehicleId: number; startDate: string; endDate: string; status: string; totalPrice: string };
type Stats = { vehicles: number; reservations: number; users: number; revenue: string; byStatus: { status: string; c: number }[] };

const EMPTY = { brand: "", model: "", year: 2023, licensePlate: "", category: "Berline", seats: 5, transmission: "Automatique", fuel: "Diesel", pricePerDay: "45", status: "disponible", description: "" };

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [vehicles, setVehicles] = useState<V[]>([]);
  const [reservations, setReservations] = useState<R[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"resa" | "flotte">("resa");

  const load = async () => {
    const me = await fetch("/api/auth/me").then((r) => r.json());
    if (!me.user) { router.push("/login"); return; }
    if (me.user.role !== "admin") { router.push("/dashboard"); return; }
    const [s, v, rr] = await Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/reservations").then((r) => r.json()),
    ]);
    setStats(s.stats ?? null);
    setVehicles(v.vehicles ?? []);
    setReservations(rr.reservations ?? []);
  };
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveVehicle = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    const url = editing ? `/api/vehicles/${editing}` : "/api/vehicles";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, year: Number(form.year), seats: Number(form.seats) }) });
    const j = await res.json();
    if (!res.ok) return setMsg(j.error || "Erreur");
    setMsg(editing ? `Véhicule #${editing} mis à jour.` : `Véhicule #${j.vehicle.id} créé.`);
    setForm(EMPTY); setEditing(null); load();
  };

  const delVehicle = async (id: number) => {
    if (!confirm(`Supprimer le véhicule #${id} ?`)) return;
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    setMsg(`Véhicule #${id} supprimé.`); load();
  };

  const setStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const j = await res.json();
    if (!res.ok) return setMsg(j.error);
    setMsg(`Réservation #${id} → ${status}`); load();
  };

  const set = (k: string, val: string | number) => setForm((f) => ({ ...f, [k]: val }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">🛡️ Console Admin · Zone 4</p>
          <h1 className="text-2xl font-black">Pilotage FleetBook</h1>
          <p className="text-sm text-slate-500">Flotte, réservations, revenus — équivalent Pod Backend supervisé par Grafana.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("resa")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "resa" ? "bg-[#0b1e3a] text-white" : "bg-white ring-1 ring-slate-200"}`}>Réservations ({reservations.length})</button>
          <button onClick={() => setTab("flotte")} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === "flotte" ? "bg-[#0b1e3a] text-white" : "bg-white ring-1 ring-slate-200"}`}>Flotte ({vehicles.length})</button>
        </div>
      </div>

      {/* KPI */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["🚗 Véhicules", stats?.vehicles ?? "…"],
          ["🧾 Réservations", stats?.reservations ?? "…"],
          ["👥 Utilisateurs", stats?.users ?? "…"],
          ["💰 Revenus (hors annulées)", stats ? `${Number(stats.revenue).toFixed(2)} €` : "…"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{k}</p>
            <p className="mt-1 text-3xl font-black text-[#0b1e3a]">{v}</p>
          </div>
        ))}
      </div>

      {stats?.byStatus && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          {stats.byStatus.map((s) => (
            <span key={s.status} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{s.status} : {s.c}</span>
          ))}
        </div>
      )}

      {msg && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">{msg}</p>}

      {tab === "resa" ? (
        <div className="mt-5 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Véhicule</th><th className="px-4 py-3">Période</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody>
                {reservations.map((r) => {
                  const v = vehicles.find((x) => x.id === r.vehicleId);
                  return (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-bold">#{r.id}</td>
                      <td className="px-4 py-3">user {r.userId}</td>
                      <td className="px-4 py-3">{v ? `${v.brand} ${v.model}` : `#${r.vehicleId}`}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.startDate} → {r.endDate}</td>
                      <td className="px-4 py-3 font-bold">{Number(r.totalPrice).toFixed(2)} €</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{r.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {["confirmee", "terminee", "annulee"].map((s) => (
                            <button key={s} onClick={() => setStatus(r.id, s)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold hover:bg-[#0b1e3a] hover:text-white">{s}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {reservations.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aucune réservation — les réservations clients apparaîtront ici.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">
          <form onSubmit={saveVehicle} className="h-fit rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <h3 className="font-extrabold">{editing ? `Modifier #${editing}` : "+ Ajouter un véhicule"}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input value={form.brand} onChange={(e) => set("brand", e.target.value)} required placeholder="Marque (Peugeot)" className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
              <input value={form.model} onChange={(e) => set("model", e.target.value)} required placeholder="Modèle (3008)" className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
              <input value={form.year} onChange={(e) => set("year", e.target.value)} type="number" placeholder="Année" className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none" />
              <input value={form.licensePlate} onChange={(e) => set("licensePlate", e.target.value)} required placeholder="Immat (AB-123-CD)" className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none" />
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none">
                {["Berline", "SUV", "Citadine", "Utilitaire", "Électrique", "Premium"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={form.pricePerDay} onChange={(e) => set("pricePerDay", e.target.value)} type="number" step="0.01" placeholder="Prix/jour €" className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none" />
              <input value={form.seats} onChange={(e) => set("seats", e.target.value)} type="number" placeholder="Places" className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none" />
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none">
                {["disponible", "loue", "maintenance"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={form.transmission} onChange={(e) => set("transmission", e.target.value)} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none">
                {["Automatique", "Manuelle"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={form.fuel} onChange={(e) => set("fuel", e.target.value)} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none">
                {["Diesel", "Essence", "Électrique", "Hybride"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description..." rows={3} className="mt-2 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-sm outline-none" />
            <button className="mt-3 w-full rounded-2xl bg-amber-400 py-2.5 text-sm font-extrabold text-[#0b1e3a] hover:bg-amber-300">{editing ? "Mettre à jour" : "Créer le véhicule"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="mt-2 w-full rounded-2xl bg-slate-100 py-2.5 text-sm font-bold">Annuler l&apos;édition</button>}
          </form>
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((v) => (
              <div key={v.id} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between">
                  <p className="font-extrabold">#{v.id} {v.brand} {v.model}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold">{v.status}</span>
                </div>
                <p className="font-mono text-xs text-slate-500">{v.licensePlate} · {v.year} · {v.category} · {Number(v.pricePerDay).toFixed(2)} €/j</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setEditing(v.id); setForm({ brand: v.brand, model: v.model, year: v.year, licensePlate: v.licensePlate, category: v.category, seats: v.seats, transmission: v.transmission, fuel: v.fuel, pricePerDay: String(v.pricePerDay), status: v.status, description: v.description ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex-1 rounded-xl bg-[#0b1e3a] py-2 text-xs font-bold text-white">Modifier</button>
                  <button onClick={() => delVehicle(v.id)} className="flex-1 rounded-xl bg-rose-50 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
