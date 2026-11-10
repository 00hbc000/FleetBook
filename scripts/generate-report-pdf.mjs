// FleetBook — Génération du rapport PDF (pdfkit, sans dépendance système)
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "RAPPORT-FleetBook.pdf");

const NAVY = "#0b1e3a";
const AMBER = "#b45309";
const GREY = "#475569";
const LIGHT = "#f1f5f9";

const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 50, right: 50 }, autoFirstPage: false });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
doc.pipe(fs.createWriteStream(OUT));

let pageNum = 0;
function footer() {
  pageNum++;
  doc.fontSize(8).fillColor("#94a3b8")
    .text(`FleetBook — Rapport de projet DevSecOps  •  page ${pageNum}`, 50, 792, { align: "center", width: 495 });
}
function newPage() {
  doc.addPage();
  footer();
  return doc;
}
function title(text, size = 20, color = NAVY) {
  doc.font("Helvetica-Bold").fontSize(size).fillColor(color).text(text, { align: "left" });
  doc.moveDown(0.4);
}
function h1(text) {
  if (doc.y > 700) newPage();
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(15).fillColor(NAVY).text(text);
  doc.moveDown(0.15);
  doc.strokeColor(AMBER).lineWidth(2).moveTo(50, doc.y).lineTo(200, doc.y).stroke();
  doc.moveDown(0.5);
}
function h2(text) {
  if (doc.y > 720) newPage();
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#1e3a5f").text(text);
  doc.moveDown(0.25);
}
function para(text, opts = {}) {
  if (doc.y > 740) newPage();
  doc.font("Helvetica").fontSize(10).fillColor("#1e293b").text(text, { align: "justify", lineGap: 3, ...opts });
  doc.moveDown(0.35);
}
function bullets(items) {
  for (const it of items) {
    if (doc.y > 750) newPage();
    doc.font("Helvetica").fontSize(10).fillColor("#1e293b")
      .text(`•  ${it}`, { indent: 12, lineGap: 3 });
    doc.moveDown(0.15);
  }
  doc.moveDown(0.3);
}
function codeBlock(lines) {
  if (doc.y > 620) newPage();
  const x = 50, w = 495;
  const startY = doc.y;
  doc.font("Courier").fontSize(8.5);
  const h = lines.length * 13 + 16;
  doc.rect(x, startY, w, h).fill(LIGHT);
  doc.fillColor("#0f172a");
  lines.forEach((l, i) => doc.text(l, x + 10, startY + 8 + i * 13, { width: w - 20 }));
  doc.y = startY + h + 10;
}
function table(rows) {
  const x = 50, widths = [150, 345];
  for (const [c1, c2] of rows) {
    const h = Math.max(doc.heightOfString(c1, { width: widths[0] - 12 }), doc.heightOfString(c2, { width: widths[1] - 12 })) + 12;
    if (doc.y + h > 770) newPage();
    doc.rect(x, doc.y, widths[0], h).fillAndStroke("#e8eef6", "#cbd5e1");
    doc.rect(x + widths[0], doc.y, widths[1], h).fillAndStroke("#ffffff", "#cbd5e1");
    doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text(c1, x + 6, doc.y + 6, { width: widths[0] - 12 });
    const yTop = doc.y;
    void yTop;
    const curY = doc.y - (doc.heightOfString(c1, { width: widths[0] - 12 }) + 0);
    doc.font("Helvetica").fontSize(9).fillColor("#1e293b").text(c2, x + widths[0] + 6, doc.y + 6 - 0, { width: widths[1] - 12 });
    doc.y += h + 2;
  }
  doc.moveDown(0.4);
}

// ============ PAGE DE GARDE ============
newPage();
doc.moveDown(2.5);
doc.font("Helvetica-Bold").fontSize(13).fillColor(AMBER).text("PROJET DEVSECOPS  •  UBUNTU / VMWARE  •  NOVEMBRE 2026", { align: "center" });
doc.moveDown(0.6);
doc.font("Helvetica-Bold").fontSize(42).fillColor(NAVY).text("FleetBook", { align: "center" });
doc.font("Helvetica").fontSize(16).fillColor(GREY).text("Plateforme de réservation de véhicules", { align: "center" });
doc.font("Helvetica").fontSize(12).fillColor(GREY).text("Site web Frontend + Backend — Pipeline GitLab CI sécurisée — Kubernetes local — Observabilité", { align: "center" });
doc.moveDown(1);
doc.strokeColor(AMBER).lineWidth(3).moveTo(180, doc.y).lineTo(415, doc.y).stroke();
doc.moveDown(1);
doc.font("Helvetica").fontSize(11).fillColor("#1e293b").text("Étudiant : [Ton Nom]      •      Encadrant : [Nom du Prof]", { align: "center" });
doc.moveDown(0.4);
doc.font("Helvetica").fontSize(11).fillColor("#1e293b").text("Environnement : Ubuntu sur VMware  •  Dépôt GitLab  •  Cluster kind / Minikube", { align: "center" });
doc.moveDown(1.2);
doc.rect(80, doc.y, 435, 92).fillAndStroke("#0b1e3a", "#0b1e3a");
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("Comptes de démonstration (données fictives TP)", 100, doc.y + 12 - 92 + 92 - 80, { width: 400 });
const boxY = doc.y;
doc.fillColor("#fcd34d").font("Courier-Bold").fontSize(10)
  .text("Admin  : admin@fleetbook.local  /  Admin123!", 100, boxY + 8, { width: 400 });
doc.fillColor("#bae6fd").font("Courier-Bold").fontSize(10)
  .text("Client : client@fleetbook.local /  Client123!", 100, boxY + 26, { width: 400 });
doc.fillColor("#cbd5e1").font("Helvetica").fontSize(9)
  .text("URL locale : http://localhost:3000   •   URL K8s : http://fleetbook.local", 100, boxY + 46, { width: 400 });
doc.y = boxY + 66;
doc.moveDown(1.5);
doc.font("Helvetica-Oblique").fontSize(9).fillColor(GREY).text("Données 100 % fictives pour TP. Journaux assainis : aucun secret, aucune donnée sensible.", { align: "center" });

// ============ SOMMAIRE ============
newPage();
title("Sommaire");
bullets([
  "1. Objectif du projet",
  "2. Notions de base (front, back, API REST, auth, BDD, Docker, Kubernetes, DevSecOps)",
  "3. Architecture DevSecOps — les 5 zones du schéma",
  "4. Ce qui a été réalisé (fonctionnel + technique + sécurité)",
  "5. Étapes de réalisation pas-à-pas sur VM Ubuntu",
  "6. Déploiement : Docker / Kubernetes / GitLab CI",
  "7. Tests & scénario de soutenance (avec attaque fictive)",
  "8. Observabilité et plan de réponse à incident",
  "9. Conclusion et perspectives",
  "10. Annexes (commandes, accès, arborescence)",
]);

// ============ 1. OBJECTIF ============
newPage();
title("1. Objectif du projet");
para("Objectif pédagogique demandé par le professeur : réaliser un site web complet avec une partie front-end (interface visible) et une partie back-end (logique serveur + base de données), puis le sécuriser et le déployer selon une démarche DevSecOps professionnelle, sur une VM Ubuntu (VMware).");
para("Objectif fonctionnel : permettre à des clients de consulter un catalogue de véhicules, de réserver en ligne en choisissant des dates, de suivre et d'annuler leurs réservations ; permettre à un administrateur de piloter la flotte (ajout / modification / suppression de véhicules), de valider les réservations et de suivre l'activité (indicateurs, revenus).");
h2("Objectifs non-fonctionnels (imposés par le schéma d'architecture)");
bullets([
  "Séparation nette Frontend / Backend / Base de données (3 pods Kubernetes distincts).",
  "Authentification + 2 rôles (Admin / Utilisateur) avec contrôle RBAC sur chaque route API.",
  "Secrets jamais en clair : variables GitLab protégées → Secrets Kubernetes → variables d'environnement.",
  "Images durcies : construction multi-étapes, base minimale Alpine, utilisateur non-root, tag versionné (jamais :latest).",
  "Pipeline GitLab CI avec contrôles : tests, SAST (Semgrep), secrets (Gitleaks), dépendances (Trivy fs), image (Trivy image), DAST (OWASP ZAP sur instance de test uniquement).",
  "Réseau Zero-Trust : NetworkPolicy deny-by-default + règles frontend→backend→DB ; garde-fou Kyverno.",
  "Observabilité : logs (Promtail → Loki), métriques (Prometheus), tableaux et alertes (Grafana).",
]);

// ============ 2. NOTIONS ============
newPage();
title("2. Notions de base");
h2("2.1 Architecture client-serveur");
para("Le navigateur (client) affiche le frontend et envoie des requêtes HTTP au backend, qui interroge la base de données et renvoie du JSON. Dans FleetBook, les trois tiers sont conteneurisés séparément ; l'image Next.js est fullstack (le même code sert les pages et l'API) mais elle est déployée en deux Deployments distincts pour respecter le schéma (Pod Frontend + Pod Backend).");
h2("2.2 Frontend");
para("Partie visible : pages, formulaires, catalogue. Réalisée en Next.js (React) + Tailwind CSS. Elle ne contient aucun secret et appelle l'API avec fetch('/api/...'). Pages : accueil/catalogue, connexion, inscription, détail véhicule, espace client, console admin.");
h2("2.3 Backend & API REST");
para("Partie logique : routes /api/* en TypeScript. REST est une convention : GET pour lire, POST pour créer, PATCH pour modifier, DELETE pour supprimer. Chaque route vérifie l'identité (JWT) et le rôle avant d'accéder à la base via Drizzle ORM, avec des requêtes paramétrées qui protègent contre les injections SQL.");
h2("2.4 Authentification & rôles (RBAC)");
bullets([
  "Mot de passe stocké haché avec bcrypt (irréversible, 10 rounds), jamais en clair.",
  "À la connexion, le serveur signe un JWT déposé en cookie httpOnly (inaccessible au JavaScript → anti-XSS), durée 7 jours.",
  "RBAC : l'admin peut tout faire (flotte + toutes les réservations + statistiques) ; l'utilisateur ne voit que ses propres réservations et peut uniquement les annuler.",
]);
h2("2.5 Base de données relationnelle");
para("PostgreSQL 16 : trois tables liées (users 1—N reservations N—1 vehicles). Les clés étrangères avec ON DELETE CASCADE garantissent la cohérence. En Kubernetes, un volume persistant (PVC 2 Go) conserve les données au redémarrage des pods.");
h2("2.6 Conteneurs & Kubernetes");
bullets([
  "Docker empaquette l'application et ses dépendances en image portable. Le Dockerfile multi-étapes produit une image finale petite sans outils de build.",
  "Kubernetes (kind / Minikube) orchestre les conteneurs en Pods dans un Namespace « fleetbook », avec Services (réseau interne), Ingress (entrée HTTP), Secrets, NetworkPolicy (pare-feu interne) et Kyverno (garde-fou qui rejette les pods non conformes).",
]);
h2("2.7 DevSecOps & pipeline");
para("DevSecOps = DevOps + sécurité à chaque étape (« shift-left » : détecter tôt). La pipeline GitLab CI exécute dans l'ordre : build → tests unitaires → SAST (analyse du code) → recherche de secrets → analyse des dépendances → construction de l'image → scan de l'image → push vers le Registry (uniquement si tout passe) → DAST (test dynamique ZAP) → déploiement kubectl.");
h2("2.8 Observabilité");
bullets([
  "Logs : chaque événement (connexion, réservation) est journalisé en JSON assaini → Promtail → Loki → Grafana.",
  "Métriques : Prometheus collecte trafic, latence et erreurs.",
  "Alertes : exemple — un pic d'échecs de connexion signale une possible attaque par force brute.",
]);

// ============ 3. ARCHI ============
newPage();
title("3. Architecture DevSecOps (5 zones)");
h2("Zone 1 — Source");
para("Le développeur pousse (git push) vers le dépôt GitLab : code de l'application, Dockerfile, docker-compose, .gitlab-ci.yml, manifestes K8s. Les variables CI/CD sont protégées et masquées (secrets fictifs uniquement en TP).");
h2("Zone 2 — Pipeline GitLab CI avec contrôles de sécurité");
bullets([
  "Build (npm run build) puis tests unitaires sur base Postgres de test.",
  "SAST Semgrep : analyse statique du code. Gitleaks : recherche de secrets. Trivy fs : dépendances.",
  "Construction de l'image (multi-étapes, base minimale, non-root) puis Trivy image.",
  "Push vers le registre uniquement si tous les contrôles passent, puis DAST OWASP ZAP sur l'instance de test de l'équipe, puis déploiement kubectl.",
]);
h2("Zone 3 — Registre d'images");
para("GitLab Registry héberge fleetbook-frontend et fleetbook-backend (même image Next.js fullstack taguée par SHA). Le cluster tire (pull) ces images versionnées.");
h2("Zone 4 — Cluster Kubernetes local (kind / Minikube)");
bullets([
  "Namespace fleetbook : Pod Frontend (interface web) → Pod Backend (API REST, auth, 2 rôles) → Pod PostgreSQL + volume persistant (véhicules, clients, réservations fictifs).",
  "Ingress / NodePort pour l'utilisateur. Secrets Kubernetes créés au déploiement depuis les variables GitLab, jamais dans les manifestes.",
  "securityContext : runAsNonRoot, readOnlyRootFilesystem, drop ALL, pas d'élévation de privilèges.",
  "NetworkPolicy : refus par défaut + règles ciblées (frontend→backend, backend→DB) + DNS.",
  "Kyverno : bloque les pods root, privilégiés, et les images non signées ou taguées :latest.",
  "Attaquant simulé (TP) : injection SQL / force brute → bloqués et journalisés.",
]);
h2("Zone 5 — Observabilité et réponse à incident");
para("Promtail / Fluent-Bit envoient les logs vers Loki ; Prometheus envoie les métriques ; Grafana centralise tableaux et alertes sur événements suspects. Plan de réponse : Détecter → Contenir → Éradiquer → Rétablir → Tirer les enseignements.");

// ============ 4. RÉALISÉ ============
newPage();
title("4. Ce qui a été réalisé");
h2("4.1 Parcours fonctionnels");
table([
  ["Visiteur", "Accueil, catalogue temps réel, recherche texte, filtre catégorie, fiche véhicule + prix/jour."],
  ["Client", "Inscription 30 s, connexion, réservation par dates (contrôle passé + anti-chevauchement), total auto (prix x jours), mes réservations, annulation 1-clic."],
  ["Admin", "Console : 4 KPI (véhicules, réservations, utilisateurs, revenus), table des réservations (confirmer / terminer / annuler), CRUD véhicules complet."],
]);
para("Données de démonstration : 8 véhicules fictifs (SUV, Citadine, Électrique, Premium, Utilitaire, Berline), 3 utilisateurs, 2 réservations.");
h2("4.2 Stack technique");
bullets([
  "Next.js 16 (App Router, output standalone), React 19, Tailwind CSS 4, Drizzle ORM, pg, bcryptjs, jsonwebtoken.",
  "Schéma : enums user_role, vehicle_status, reservation_status ; clés étrangères ON DELETE CASCADE.",
  "12 routes API (auth x4, vehicles x3, reservations x3, stats, health) avec codes HTTP corrects (400/401/403/404/409/500) et messages génériques au login.",
  "Interface responsive (navy #0b1e3a + ambre), cartes catalogue, hero « pods running », badges de statut, tableaux admin.",
]);
h2("4.3 Sécurité applicative");
bullets([
  "bcrypt (10 rounds), JWT httpOnly SameSite=Lax (Secure en prod), contrôle RBAC getSession() sur chaque route.",
  "Requêtes paramétrées Drizzle (anti injection SQL), validation des dates, immatriculation unique.",
  "Logs assainis safeLog() : les clés password / secret / token / hash sont filtrées avant écriture.",
]);

// ============ 5. STEPS ============
newPage();
title("5. Étapes pas-à-pas (VM Ubuntu)");
h2("Étape 0 — Préparer la VM (15 min)");
codeBlock([
  "sudo apt update && sudo apt upgrade -y",
  "sudo apt install -y git curl postgresql postgresql-contrib",
  "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
  "sudo apt install -y nodejs   # v20.x attendu",
  "sudo systemctl enable --now postgresql",
]);
h2("Étape 1 — Lancer le site (20 min) — exigé par le prof");
codeBlock([
  "git clone https://gitlab.com/TON-GROUPE/fleetbook.git && cd fleetbook",
  "npm install",
  "cp .env.example .env   # DATABASE_URL + JWT_SECRET fictifs",
  "npx drizzle-kit push   # crée les 3 tables",
  "psql $DATABASE_URL -f scripts/seed.sql",
  "npm run dev   # -> http://localhost:3000",
]);
para("Vérifications : catalogue visible → inscription client → réservation → tableau de bord → déconnexion → connexion admin → console → CRUD véhicule.");
h2("Étape 2 — Build de production (10 min)");
codeBlock(["npm run build && npm run start", "curl http://localhost:3000/api/health  # {\"ok\":true}"]);
h2("Étape 3 — Docker (10 min)");
codeBlock(["docker build -t fleetbook:test .", "docker compose up --build  # -> http://localhost:3000"]);

// ============ 6. DEPLOIEMENT ============
newPage();
title("6. Déploiement Kubernetes & CI");
h2("GitLab + pipeline (30 min)");
para("Pousser sur main, renseigner dans Settings → CI/CD → Variables (protected + masked) : DATABASE_URL_PROD, JWT_SECRET, KUBE_CONFIG (base64), POSTGRES_USER / PASSWORD / DB. Les 9 stages s'exécutent ; les images arrivent dans Deploy → Container Registry.");
h2("Kubernetes local (30 min)");
codeBlock([
  "kind create cluster --name fleetbook  # ou minikube start",
  "kubectl create namespace fleetbook",
  "kubectl -n fleetbook create secret generic fleetbook-secrets \\",
  "  --from-literal=DATABASE_URL='...' --from-literal=JWT_SECRET='...' \\",
  "  --from-literal=POSTGRES_USER='fleetbook' \\",
  "  --from-literal=POSTGRES_PASSWORD='...' --from-literal=POSTGRES_DB='fleetbook'",
  "kubectl apply -f k8s/",
  "kubectl -n fleetbook get pods,svc,ingress",
]);
h2("Observabilité (bonus, 20 min)");
codeBlock([
  "helm install loki grafana/loki-stack -n observability --create-namespace",
  "helm install kube-prom prometheus-community/kube-prometheus-stack -n observability",
  "kubectl apply -f k8s/50-observability.yaml",
]);
h2("Récapitulatif des modes");
table([
  ["Dev (soutenance)", "npm run dev — démo au prof, hot-reload."],
  ["Prod locale", "npm run build && npm run start — test performance."],
  ["Docker Compose", "docker compose up --build — équivalent 3 tiers sans K8s."],
  ["Kubernetes", "kubectl apply -f k8s/ — cible officielle Zone 4."],
  ["CI/CD", "git push origin main — Zones 2→3→4 automatiques."],
]);

// ============ 7. SOUTENANCE ============
newPage();
title("7. Tests & soutenance (5 min chrono)");
bullets([
  "Catalogue (30 s) : recherche « Tesla », filtre SUV, 8 véhicules affichés.",
  "Client (1 min) : inscription → fiche Peugeot 3008 → dates → total 195 € → Mes réservations → annulation.",
  "Admin (1 min) : connexion admin → KPI → passage en « confirmee » → ajout d'un véhicule → visible au catalogue.",
  "API (30 s) : GET /api/vehicles, GET /api/stats (403 si client).",
  "Attaque fictive (1 min 30, point fort) : injection SQL avec OR 1=1 → « Email ou mot de passe incorrect », rien ne fuit ; 20 mauvais logins → alerte Grafana LoginBruteForceSuspecte → réciter Détecter > Contenir > Éradiquer > Rétablir > Enseignements.",
  "K8s (30 s) : kubectl get pods -n fleetbook (3 Running), NetworkPolicy, Kyverno qui rejette un pod :latest.",
]);

// ============ 8. OBSERVABILITÉ ============
newPage();
title("8. Observabilité & réponse à incident");
h2("Logs, métriques, alertes");
bullets([
  'Logs JSON : {"service":"fleetbook-backend","event":"login_failed",...} → Loki → Grafana. Aucun hash ni token.',
  "Métriques : requêtes/min, erreurs 5xx, réservations par statut, échecs login.",
  "Alertes : LoginBruteForceSuspecte (> 0,2 échec/s pendant 2 min), ErreursApiElevees.",
]);
h2("Plan de réponse");
table([
  ["Détecter", "Alerte Grafana / logs Loki (ex. pic d'échecs login)."],
  ["Contenir", "NetworkPolicy, scale to 0, rotation du JWT_SECRET."],
  ["Éradiquer", "Patch du code + nouveau scan Trivy / Semgrep."],
  ["Rétablir", "Rollout Kubernetes + restauration PVC si besoin."],
  ["Enseignements", "Post-mortem, nouvelle règle Kyverno / Semgrep."],
]);

// ============ 9-10. CONCLUSION + ANNEXES ============
newPage();
title("9. Conclusion et perspectives");
para("Le site front + back exigé est livré, testé et déployable en quatre modes (dev, prod, Docker, Kubernetes) avec une pipeline sécurisée complète. Apports principaux : contrôle d'accès réel par rôles, anti double-réservation, images et cluster durcis, secrets hors git, traçabilité sans données sensibles.");
para("Perspectives : paiement fictif, envoi de photos (stockage objet), tests Jest / Playwright, signature d'images Cosign, détection runtime Falco, multilinguisme FR/AR/EN.");
title("10. Annexes");
h2("Accès");
bullets([
  "Dev : http://localhost:3000 — K8s : http://fleetbook.local — Grafana : port-forward 3001:80.",
  "Santé : GET /api/health → {\"ok\":true}. Builds verts : typegen + tsc + next build.",
]);
h2("Arborescence livrée");
codeBlock([
  "src/app/ (/, /login, /register, /dashboard, /admin, /vehicles/[id])",
  "src/app/api/ (auth/*, vehicles/*, reservations/*, stats, health)",
  "src/db/schema.ts, src/lib/auth.ts, src/components/Navbar.tsx",
  "Dockerfile, docker-compose.yml, .gitlab-ci.yml, k8s/*.yaml",
  "scripts/seed.sql, .env.example, GUIDE-UBUNTU.md",
]);
doc.moveDown(1);
doc.font("Helvetica-Oblique").fontSize(10).fillColor(GREY).text("Fin du rapport — bon courage pour la soutenance FleetBook !", { align: "center" });

doc.end();
console.log("PDF écrit vers", OUT);
