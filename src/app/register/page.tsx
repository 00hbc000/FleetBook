"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(j.error || "Erreur");
    r.push("/dashboard");
    r.refresh();
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <form onSubmit={submit} className="rounded-3xl bg-white p-8 ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Espace client</p>
        <h1 className="mt-1 text-2xl font-black">Créer un compte</h1>
        <p className="text-sm text-slate-500">Réservez vos véhicules en 2 minutes. Gratuit, sans engagement.</p>
        {err && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">{err}</p>}
        <label className="mt-5 block text-sm font-bold">Nom complet
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex : Amina Benali" className="mt-1 w-full rounded-xl bg-slate-100 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="mt-4 block text-sm font-bold">Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="vous@exemple.com" className="mt-1 w-full rounded-xl bg-slate-100 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <label className="mt-4 block text-sm font-bold">Mot de passe (6 car. min)
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" minLength={6} placeholder="••••••••" className="mt-1 w-full rounded-xl bg-slate-100 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-amber-400" />
        </label>
        <button disabled={loading} className="mt-6 w-full rounded-2xl bg-amber-400 py-3 font-extrabold text-[#0b1e3a] hover:bg-amber-300 disabled:opacity-60">
          {loading ? "Création..." : "Créer mon compte →"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">Déjà inscrit ? <Link href="/login" className="font-bold text-blue-700 hover:underline">Se connecter</Link></p>
      </form>
    </main>
  );
}
