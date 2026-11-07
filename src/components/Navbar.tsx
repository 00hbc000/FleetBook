"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type U = { id: number; name: string; email: string; role: string } | null;

export default function Navbar() {
  const [user, setUser] = useState<U>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const load = async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await r.json();
      setUser(j.user);
    } catch { setUser(null); }
  };
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer);
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1e3a]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-xl font-black text-[#0b1e3a]">F</span>
          <span className="leading-tight">
            <span className="block text-[17px] font-extrabold tracking-tight">FleetBook</span>
            <span className="block text-[11px] uppercase tracking-[0.2em] text-sky-300">Réservation véhicules</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link href="/" className="rounded-lg px-3 py-2 hover:bg-white/10">Catalogue</Link>
          <Link href="/#comment-ca-marche" className="rounded-lg px-3 py-2 hover:bg-white/10">Comment ça marche</Link>
          {user?.role === "user" && <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-white/10">Mes réservations</Link>}
          {user?.role === "admin" && <Link href="/admin" className="rounded-lg bg-amber-400 px-3 py-2 font-semibold text-[#0b1e3a] hover:bg-amber-300">Console Admin</Link>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-white/10">Se connecter</Link>
              <Link href="/register" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-[#0b1e3a] hover:bg-amber-300">Créer un compte</Link>
            </>
          ) : (
            <>
              <span className="max-w-[180px] truncate rounded-full bg-white/10 px-3 py-1.5 text-xs">
                {user.role === "admin" ? "🛡️ Admin · " : "👤 "}{user.name}
              </span>
              {user.role === "user" && <Link href="/dashboard" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Espace client</Link>}
              <button onClick={logout} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0b1e3a] hover:bg-slate-200">Déconnexion</button>
            </>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-lg bg-white/10 px-3 py-2 md:hidden">☰</button>
      </div>
      {open && (
        <div className="space-y-1 border-t border-white/10 px-4 py-3 text-sm md:hidden">
          <Link href="/" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">Catalogue</Link>
          {!user ? (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">Se connecter</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="block rounded-lg bg-amber-400 px-3 py-2 font-bold text-[#0b1e3a]">Créer un compte</Link>
            </>
          ) : (
            <>
              {user.role === "admin"
                ? <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-lg bg-amber-400 px-3 py-2 font-bold text-[#0b1e3a]">Console Admin</Link>
                : <Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-lg bg-white/10 px-3 py-2">Mes réservations</Link>}
              <button onClick={logout} className="block w-full rounded-lg bg-white px-3 py-2 text-left font-bold text-[#0b1e3a]">Déconnexion ({user.name})</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
