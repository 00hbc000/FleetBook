"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  category: string;
  seats: number;
  transmission: string;
  fuel: string;
  pricePerDay: string;
  status: string;
  imageUrl?: string | null;
  description?: string | null;
};

const CATEGORY_EMOJI: Record<string, string> = {
  Berline: "🚗",
  SUV: "🚙",
  Utilitaire: "🚐",
  Électrique: "⚡",
  Premium: "✨",
  Citadine: "🚕",
};

const QUICK_CATS = ["Berline", "SUV", "Citadine", "Utilitaire", "Électrique", "Premium"];

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (qv = q, cv = cat) => {
    setLoading(true);
    const p = new URLSearchParams();
    if (qv) p.set("q", qv);
    if (cv) p.set("category", cv);
    try {
      const r = await fetch(`/api/vehicles?${p.toString()}`, { cache: "no-store" });
      const j = await r.json();
      setVehicles(j.vehicles ?? []);
    } catch {
      setVehicles([]);
    }
    setLoading(false);
  };

  useEffect(() => { const timer = setTimeout(() => void load("", ""), 0); return () => clearTimeout(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickCat = (c: string) => {
    setCat(c);
    load(q, c);
    document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" });
  };

  const available = useMemo(() => vehicles.filter((v) => v.status === "disponible").length, [vehicles]);

  const statusBadge = (s: string) =>
    s === "disponible" ? "bg-emerald-100 text-emerald-800"
    : s === "loue" ? "bg-amber-100 text-amber-800"
    : "bg-rose-100 text-rose-800";

  const statusLabel = (s: string) =>
    s === "disponible" ? "Disponible" : s === "loue" ? "Loué" : "En entretien";

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1e3a] text-white">
        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Location de véhicules — simple &amp; rapide
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              La voiture qu&apos;il vous faut, <span className="text-amber-400">quand il vous faut</span>
            </h1>
            <p className="mt-4 max-w-xl text-slate-300">
              Citadine, SUV, électrique ou utilitaire : réservez en ligne en 2 minutes, payez à l&apos;agence, partez l&apos;esprit tranquille. Assurance incluse, kilométrage illimité.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#catalogue" className="rounded-2xl bg-amber-400 px-6 py-3 font-extrabold text-[#0b1e3a] hover:bg-amber-300">Voir les véhicules ↓</a>
              <Link href="/register" className="rounded-2xl bg-white/10 px-6 py-3 font-bold ring-1 ring-white/20 hover:bg-white/20">Créer un compte gratuit</Link>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
              {[
                [loading ? "…" : `${available}+`, "Disponibles"],
                ["Gratuite", "Annulation 48h"],
                ["7j/7", "Assistance"],
              ].map(([a, b]) => (
                <div key={b} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <p className="text-lg font-extrabold text-amber-300">{a}</p>
                  <p className="text-xs uppercase tracking-wider text-slate-400">{b}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="relative min-h-[320px] overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-blue-800 to-indigo-950" />
              <img src="/images/hero-fleet.jpg" alt="Notre flotte de véhicules" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1e3a]/80 via-transparent to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-[#0b1e3a]">Dès 32 € / jour</span>
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 glass">
                <div>
                  <p className="font-extrabold">⭐ 4,8/5 — 1 200+ locations</p>
                  <p className="text-xs text-slate-300">Assurance tous risques incluse</p>
                </div>
                <a href="#catalogue" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-extrabold text-[#0b1e3a] hover:bg-amber-300">Réserver</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH + QUICK CATEGORIES */}
      <section id="catalogue" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-10 sm:px-6">
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
            <span>🔎</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Rechercher : Clio, Peugeot, SUV..." className="w-full bg-transparent outline-none" />
          </div>
          <button onClick={() => load()} className="rounded-2xl bg-[#0b1e3a] px-6 py-3 font-bold text-white hover:bg-[#14305c]">Rechercher</button>
          {(q || cat) && <button onClick={() => { setQ(""); setCat(""); load("", ""); }} className="rounded-2xl px-4 py-3 text-sm text-slate-500 hover:underline">Réinitialiser</button>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => pickCat("")} className={`rounded-full px-4 py-2 text-sm font-bold ring-1 ${cat === "" ? "bg-[#0b1e3a] text-white ring-[#0b1e3a]" : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-400"}`}>Tout</button>
          {QUICK_CATS.map((c) => (
            <button key={c} onClick={() => pickCat(c)} className={`rounded-full px-4 py-2 text-sm font-bold ring-1 ${cat === c ? "bg-[#0b1e3a] text-white ring-[#0b1e3a]" : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-400"}`}>
              {CATEGORY_EMOJI[c] ?? "🚗"} {c}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Nos véhicules</h2>
            <p className="text-sm text-slate-500">{loading ? "Chargement..." : `${vehicles.length} véhicule(s) ${cat ? `en ${cat}` : ""}`}</p>
          </div>
          <Link href="/dashboard" className="hidden text-sm font-bold text-blue-700 hover:underline sm:block">Mes réservations →</Link>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-white ring-1 ring-slate-200" />)}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200">
            <p className="text-4xl">🚗</p>
            <p className="mt-2 font-bold">Aucun véhicule pour cette recherche</p>
            <p className="text-sm text-slate-500">Essayez un autre mot-clé ou une autre catégorie.</p>
            <button onClick={() => { setQ(""); setCat(""); load("", ""); }} className="mt-4 rounded-xl bg-[#0b1e3a] px-5 py-2.5 text-sm font-bold text-white">Tout afficher</button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <article key={v.id} className="card-hover overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-900 via-[#0b1e3a] to-sky-800 p-5 text-white">
                  {v.imageUrl && <img src={v.imageUrl} alt={`${v.brand} ${v.model}`} className="absolute inset-0 h-full w-full object-cover" />}
                  <div className="relative flex items-start justify-between">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadge(v.status)}`}>{statusLabel(v.status)}</span>
                    <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold">{CATEGORY_EMOJI[v.category] ?? "🚗"} {v.category}</span>
                  </div>
                  {!v.imageUrl && <p className="relative mt-8 text-5xl drop-shadow">{CATEGORY_EMOJI[v.category] ?? "🚗"}</p>}
                  <p className="relative mt-1 font-mono text-[11px] text-sky-200">{v.year} · {v.seats} places · {v.transmission}</p>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-extrabold">{v.brand} {v.model}</h3>
                  <p className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">🪑 {v.seats} places</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">⚙️ {v.transmission}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">⛽ {v.fuel}</span>
                  </p>
                  {v.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{v.description}</p>}
                  <div className="mt-4 flex items-center justify-between">
                    <p><span className="text-2xl font-black text-[#0b1e3a]">{Number(v.pricePerDay).toFixed(0)} €</span><span className="text-xs text-slate-500"> / jour</span></p>
                    <Link href={`/vehicles/${v.id}`} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-[#0b1e3a] hover:bg-amber-300">Réserver →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section id="comment-ca-marche" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6">
        <h2 className="text-2xl font-black tracking-tight">Comment ça marche ?</h2>
        <p className="mt-1 text-sm text-slate-500">Trois étapes, et vous êtes sur la route.</p>
        <div className="mt-4 grid gap-4 rounded-3xl bg-[#0b1e3a] p-6 text-white sm:p-10 lg:grid-cols-3">
          {[
            ["1️⃣", "Créez votre compte", "Gratuit, en 30 secondes. Retrouvez ensuite toutes vos locations au même endroit."],
            ["2️⃣", "Choisissez & réservez", "Sélectionnez votre véhicule et vos dates. Le prix total s'affiche aussitôt, sans surprise."],
            ["3️⃣", "Récupérez vos clés", "Présentez-vous à l'agence avec votre permis, réglez sur place et prenez la route."],
          ].map(([e, t, d]) => (
            <div key={t} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <p className="text-3xl">{e}</p>
              <p className="mt-2 font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-slate-300">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-black tracking-tight">Pourquoi choisir FleetBook ?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["🛡️", "Assurance incluse", "Tous risques comprise dans chaque location, sans option cachée."],
            ["🛣️", "Kilométrage illimité", "Roulez autant que vous voulez, le compteur ne vous freine pas."],
            ["↩️", "Annulation gratuite", "Changement de programme ? Annulez sans frais jusqu'à 48h avant."],
            ["📞", "Assistance 7j/7", "Une équipe joignable tous les jours en cas de pépin sur la route."],
          ].map(([e, t, d]) => (
            <div key={t} className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <p className="text-3xl">{e}</p>
              <p className="mt-2 font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <h2 className="text-2xl font-black tracking-tight">Ils roulent avec nous</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["Sophie L.", "⭐⭐⭐⭐⭐", "Réservation en deux minutes pour un week-end. Voiture impeccable et accueil adorable à l'agence."],
            ["Mehdi K.", "⭐⭐⭐⭐⭐", "J'ai dû décaler mes dates : annulation et nouvelle réservation sans aucun frais. Très pro."],
            ["Julie R.", "⭐⭐⭐⭐☆", "La Tesla était parfaite pour notre road-trip. Le prix affiché en ligne, c'est le prix payé."],
          ].map(([n, s, t]) => (
            <figure key={n} className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <p className="text-sm">{s}</p>
              <blockquote className="mt-2 text-sm text-slate-700">« {t} »</blockquote>
              <figcaption className="mt-3 text-sm font-extrabold text-[#0b1e3a]">{n}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1e3a] to-sky-800 p-8 text-center text-white sm:p-12">
          <h2 className="text-3xl font-black">Prêt à prendre la route ? 🚗</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-300">Créez votre compte gratuit et réservez votre première voiture en moins de deux minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-2xl bg-amber-400 px-6 py-3 font-extrabold text-[#0b1e3a] hover:bg-amber-300">Je m&apos;inscris gratuitement</Link>
            <a href="#catalogue" className="rounded-2xl bg-white/10 px-6 py-3 font-bold ring-1 ring-white/20 hover:bg-white/20">Revoir les véhicules</a>
          </div>
        </div>
      </section>
    </main>
  );
}
