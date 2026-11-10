import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FleetBook — Location de véhicules",
  description: "Réservez votre véhicule en 2 minutes : citadines, SUV, électriques et utilitaires. Assurance incluse, annulation gratuite.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <Navbar />
        {children}
        <footer className="mt-16 bg-[#0b1e3a] px-4 py-12 text-slate-300">
          <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-lg font-extrabold text-white">FleetBook</p>
              <p className="mt-2 text-sm text-slate-400">La location de véhicules simple et rapide : réservez en ligne, payez à l&apos;agence.</p>
              <p className="mt-3 text-sm text-slate-400">📞 05 00 00 00 00<br />✉️ contact@fleetbook.local<br />📍 12 avenue des Fleurs, Casablanca</p>
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">Nos véhicules</p>
              <ul className="mt-2 space-y-1.5 text-slate-400">
                <li><Link href="/#catalogue" className="hover:text-amber-300">Tous les véhicules</Link></li>
                <li><Link href="/#catalogue" className="hover:text-amber-300">SUV &amp; familiales</Link></li>
                <li><Link href="/#catalogue" className="hover:text-amber-300">Électriques</Link></li>
                <li><Link href="/#catalogue" className="hover:text-amber-300">Utilitaires</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">Aide</p>
              <ul className="mt-2 space-y-1.5 text-slate-400">
                <li><Link href="/#comment-ca-marche" className="hover:text-amber-300">Comment réserver ?</Link></li>
                <li><Link href="/dashboard" className="hover:text-amber-300">Suivre mes réservations</Link></li>
                <li><Link href="/register" className="hover:text-amber-300">Créer un compte</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">Mon compte</p>
              <ul className="mt-2 space-y-1.5 text-slate-400">
                <li><Link href="/login" className="hover:text-amber-300">Se connecter</Link></li>
                <li><Link href="/dashboard" className="hover:text-amber-300">Mes réservations</Link></li>
                <li><Link href="/login" className="hover:text-amber-300">Espace professionnel</Link></li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-1 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
            <p>© 2026 FleetBook — Projet pédagogique, données fictives.</p>
            <p>Annulation gratuite jusqu&apos;à 48h avant le départ</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
