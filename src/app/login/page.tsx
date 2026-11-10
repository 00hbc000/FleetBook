"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json();
      setLoading(false);
      if (!res.ok) return setErr(j.error || "Erreur de connexion");
      if (j.user.role === "admin") r.push("/admin");
      else r.push("/dashboard");
      r.refresh();
    } catch {
      setLoading(false);
      setErr("Impossible de se connecter, réessayez.");
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl bg-[#0b1e3a] p-8 text-white">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-300">Bon retour parmi nous</p>
        <h1 className="mt-2 text-3xl font-black">Connectez-vous et prenez la route</h1>
        <p className="mt-2 text-sm text-slate-300">Retrouvez vos réservations, vos factures et vos véhicules favoris au même endroit.</p>
        <ul className="mt-6 space-y-3 text-sm">
          {[
            ["🧾", "Suivi de vos locations en temps réel"],
            ["↩️", "Annulation gratuite jusqu'à 48h avant"],
            ["⚡", "Réservation express en 2 minutes"],
          ].map(([e, t]) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <span className="text-xl">{e}</span><span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-slate-400">Pas encore de compte ? La création est gratuite et prend 30 secondes.</p>
        <Link href="/register" className="mt-2 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/20 hover:bg-white/20">Créer un compte →</Link>
      </div>
      <form onSubmit={submit} className="h-fit rounded-3xl bg-white p-8 ring-1 ring-slate-200">
        <h2 className="text-xl font-extrabold">Se connecter</h2>
        <p className="text-sm text-slate-500">Accédez à votre espace FleetBook.</p>
        {err && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">{err}</p>}
        <label className="mt-5 block text-sm font-bold">Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="vous@exemple.com" className="mt-1 w-full rounded-xl bg-slate-100 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="mt-4 block text-sm font-bold">Mot de passe
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" placeholder="••••••••" className="mt-1 w-full rounded-xl bg-slate-100 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <button disabled={loading} className="mt-6 w-full rounded-2xl bg-[#0b1e3a] py-3 font-extrabold text-white hover:bg-[#14305c] disabled:opacity-60">
          {loading ? "Connexion..." : "Connexion →"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">Pas de compte ? <Link href="/register" className="font-bold text-blue-700 hover:underline">Créer un compte gratuit</Link></p>
      </form>
    </main>
  );
}
