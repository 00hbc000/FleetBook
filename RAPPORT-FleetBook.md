> **Brouillon fourni avec le dossier Drive.** Les étapes Kubernetes, CI, DAST et observabilité ci-dessous ne sont pas vérifiées dans la version migrée. Ne pas présenter ces passages comme des preuves. Voir README.md pour le démarrage actuel.

# FleetBook — Rapport de Projet DevSecOps
## Plateforme de Réservation de Véhicules (Frontend + Backend)

> **Étudiant :** [Ton Nom] — **Encadrant :** [Nom du Prof] — **Date :** Novembre 2026
> **Environnement :** Ubuntu sur VMware — **Dépôt :** GitLab — **Cluster :** kind / Minikube
> **Comptes démo :** Admin `admin@fleetbook.local` / `Admin123!` — Client `client@fleetbook.local` / `Client123!`

---

## Sommaire
1. Objectif du projet
2. Notions de base
3. Architecture DevSecOps (5 zones)
4. Ce qui a été réalisé (fonctionnel + technique)
5. Étapes de réalisation pas-à-pas (VM Ubuntu)
6. Déploiement Docker / Kubernetes / GitLab CI
7. Tests & scénario de soutenance (dont attaque fictive)
8. Observabilité et plan de réponse à incident
9. Conclusion et perspectives
10. Annexes (commandes, accès, arborescence)

---

## 1. Objectif du projet

**Objectif pédagogique demandé par le professeur :** réaliser un site web complet front-end + back-end, puis le sécuriser et le déployer selon une démarche DevSecOps professionnelle.

**Objectif fonctionnel :** permettre à des clients de consulter un catalogue de véhicules, de réserver en ligne par dates, de suivre/annuler leurs réservations ; permettre à un administrateur de piloter la flotte (CRUD véhicules), de valider les réservations et de suivre l'activité (KPI, revenus).

**Objectifs non-fonctionnels (imposés par le schéma) :**
- Séparation nette Frontend / Backend / Base de données (3 pods Kubernetes).
- Authentification + 2 rôles (Admin / Utilisateur) avec contrôle RBAC sur chaque route.
- Secrets jamais en clair : variables GitLab → Secrets Kubernetes → variables d'environnement.
- Images durcies : multi-étapes, base minimale Alpine, utilisateur non-root, pas de tag `:latest`.
- Pipeline GitLab CI avec contrôles : tests, SAST (Semgrep), secrets (Gitleaks), dépendances (Trivy fs), image (Trivy image), DAST (OWASP ZAP sur instance de test uniquement).
- Réseau Zero-Trust : NetworkPolicy deny-by-default + règles frontend→backend→DB ; admission Kyverno.
- Observabilité : logs (Promtail/Fluent-Bit → Loki), métriques (Prometheus), dashboards/alertes (Grafana).
- Données 100 % fictives, journaux assainis (aucun secret, aucune donnée sensible).

---

## 2. Notions de base (pour comprendre le rapport)

### 2.1 Architecture Client-Serveur
Le navigateur (client) affiche le **frontend** et envoie des requêtes HTTP au **backend**, qui interroge la **base de données** et renvoie du JSON. Ici les trois tiers sont conteneurisés séparément mais l'image Next.js est fullstack (même code sert les pages + l'API, déployé en 2 Deployments distincts pour respecter le schéma).

### 2.2 Frontend
Partie visible : pages, formulaires, catalogue. Réalisée en **Next.js (React) + Tailwind CSS**. Elle ne contient aucun secret et appelle l'API via `fetch('/api/...')`.

### 2.3 Backend & API REST
Partie logique : **routes `/api/*`** en TypeScript. REST = convention : `GET` lire, `POST` créer, `PATCH` modifier, `DELETE` supprimer. Chaque route vérifie l'identité (JWT) et le rôle avant d'accéder à la base via **Drizzle ORM** (requêtes paramétrées = anti injection SQL).

### 2.4 Authentification & rôles (RBAC)
- Mot de passe stocké **haché avec bcrypt** (irréversible), jamais en clair.
- À la connexion, le serveur signe un **JWT** (jeton) déposé en **cookie httpOnly** (inaccessible au JavaScript → anti-XSS), durée 7 jours.
- **RBAC** : `admin` peut tout faire (flotte + toutes réservations + stats) ; `user` ne voit/modifie que ses propres réservations (annulation uniquement).

### 2.5 Base de données relationnelle
**PostgreSQL 16** : 3 tables liées (`users 1—N reservations N—1 vehicles`). Volume persistant (PVC 2Gi) en Kubernetes pour ne pas perdre les données au redémarrage.

### 2.6 Conteneurs & Kubernetes
- **Docker** : empaquette l'app + dépendances en image portable. Dockerfile multi-étapes = image finale petite (~150 Mo) sans outils de build.
- **Kubernetes (kind/Minikube)** : orchestre les conteneurs en **Pods** dans un **Namespace `fleetbook`**, avec **Services** (réseau interne), **Ingress** (entrée HTTP), **Secrets**, **NetworkPolicy** (pare-feu interne), **Kyverno** (garde-fou qui rejette les pods non conformes).

### 2.7 DevSecOps & pipeline
DevSecOps = DevOps + sécurité à chaque étape (« shift-left »). La pipeline GitLab CI exécute dans l'ordre : build → tests unitaires → SAST (analyse code) → secrets → dépendances → build image → scan image → push Registry (uniquement si tout passe) → DAST (test dynamique ZAP) → déploiement kubectl.

### 2.8 Observabilité
- **Logs** : chaque événement (login, réservation) est loggé en JSON assaini → Promtail → Loki → Grafana.
- **Métriques** : Prometheus scrape le trafic/latence/erreurs.
- **Alertes** : ex. pic d'échecs login = suspicion de force brute.

---

## 3. Architecture DevSecOps (les 5 zones du schéma)

```
ZONE 1 (Source) : Dev --git push--> Dépôt GitLab (code + Dockerfile + docker-compose + .gitlab-ci.yml + k8s/)
ZONE 2 (Pipeline) : Build > Tests > SAST(Semgrep) > Gitleaks > Trivy fs > Build image > Trivy image > Push > ZAP > Deploy(kubectl)
ZONE 3 (Registry) : GitLab Registry [fleetbook-frontend, fleetbook-backend] --pull--> Cluster
ZONE 4 (K8s local kind/Minikube, ns fleetbook) :
  Navigateur --Ingress--> Pod Frontend --(NetworkPolicy)--> Pod Backend --(NetworkPolicy)--> Pod PostgreSQL+PVC
  Secrets K8s (depuis variables GitLab) injectés en env. Kyverno enforce non-root/readOnlyFS/drop ALL/no-latest.
  Attaquant simulé -X-> Backend (injection SQL / brute force = bloqués + loggés)
ZONE 5 (Observabilité) : Pods --Promtail--> Loki --> Grafana <-- Prometheus (+ Falco bonus). Plan : Détecter>Contenir>Éradiquer>Rétablir>Enseignements.
```

**Flux légende :** code (bleu) → CI/CD (ocre) → déploiement (vert) → attaque/blocage (rouge) → bonus/optionnel (pointillés).

---

## 4. Ce qui a été réalisé

### 4.1 Fonctionnel
| Acteur | Parcours |
|---|---|
| Visiteur | Accueil, catalogue temps réel, recherche texte, filtre catégorie, détail véhicule + prix/jour |
| Client | Inscription 30s, connexion, réservation par dates (contrôle passé + chevauchement), calcul auto total (prix×jours), mes réservations, annulation 1-clic |
| Admin | Console : 4 KPI (véhicules, réservations, utilisateurs, revenus), table toutes réservations (confirmer/terminer/annuler), CRUD véhicules (marque, modèle, année, immat unique, catégorie, places, boîte, carburant, prix, statut, description) |

8 véhicules fictifs (SUV, Citadine, Électrique, Premium, Utilitaire, Berline), 3 utilisateurs, 2 réservations de démo.

### 4.2 Technique
- **Stack :** Next.js 16 (App Router, `output: standalone`), React 19, Tailwind 4, Drizzle ORM, `pg`, `bcryptjs`, `jsonwebtoken`.
- **Schéma BDD :** enums `user_role`, `vehicle_status`, `reservation_status` ; FK avec `ON DELETE CASCADE`.
- **API :** 12 routes (auth×4, vehicles×3, reservations×3, stats, health). Validation systématique, codes HTTP corrects (400/401/403/404/409/500), messages génériques au login.
- **UI :** responsive, navy `#0b1e3a` + ambre, cartes catalogue, hero « pods running », badges statut, tableaux admin.
- **Sécurité app :** bcrypt(10 rounds), JWT httpOnly SameSite=Lax Secure en prod, RBAC middleware `getSession()`, Drizzle paramétré, `safeLog()` qui filtre password/secret/token/hash.
- **K8s :** `00-namespace`, `10-postgres` (PVC+Deployment+Service+probes), `20-backend` (2 réplicas, probes /api/health, resources, securityContext), `21-frontend`, `30-ingress-networkpolicy` (deny-all + 3 policies + DNS egress), `40-kyverno-policies` (2 ClusterPolicies Enforce), `50-observability` (dashboard + PrometheusRule brute-force).

### 4.3 Arborescence livrée
```
src/app/ (/, /login, /register, /dashboard, /admin, /vehicles/[id])
src/app/api/ (auth/*, vehicles/*, reservations/*, stats, health)
src/db/schema.ts, src/lib/auth.ts, src/components/Navbar.tsx
Dockerfile, docker-compose.yml, .gitlab-ci.yml, k8s/*.yaml
scripts/seed.sql, .env.example, GUIDE-UBUNTU.md, RAPPORT-FleetBook.md
```

---

## 5. Étapes de réalisation pas-à-pas (VM Ubuntu sur VMware)

### Étape 0 — Préparer la VM (15 min)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget ca-certificates gnupg lsb-release postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v   # v20.x attendu
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER fleetbook WITH PASSWORD 'fleetbook_pwd_change_me';"
sudo -u postgres psql -c "CREATE DATABASE fleetbook OWNER fleetbook;"
```

### Étape 1 — Récupérer et lancer le site (20 min) — EXIGÉ PAR LE PROF
```bash
git clone https://gitlab.com/TON-GROUPE/fleetbook.git && cd fleetbook
npm install
cp .env.example .env   # renseigner DATABASE_URL + JWT_SECRET (fictifs)
npx drizzle-kit push   # crée les 3 tables
psql $DATABASE_URL -f scripts/seed.sql  # admin + client + 8 véhicules
npm run dev            # → http://localhost:3000
```
Vérifier : catalogue visible → inscription client → réservation → dashboard → déconnexion → login admin → console → CRUD véhicule.

### Étape 2 — Build de production (10 min)
```bash
npm run build && npm run start
curl http://localhost:3000/api/health  # {"ok":true}
```

### Étape 3 — Docker (10 min)
```bash
docker build -t fleetbook:test .
docker run --rm -p 3000:3000 --env-file .env fleetbook:test
# ou : docker compose up --build
```

### Étape 4 — GitLab + pipeline (30 min)
Pousser sur `main`, renseigner en Settings → CI/CD → Variables (protected + masked) : `DATABASE_URL_PROD, JWT_SECRET, KUBE_CONFIG (base64), POSTGRES_USER/PASSWORD/DB`. Observer les 9 stages passer, récupérer les images dans Deploy → Container Registry.

### Étape 5 — Kubernetes local (30 min)
```bash
kind create cluster --name fleetbook   # ou minikube start --driver=docker
kubectl create namespace fleetbook
kubectl -n fleetbook create secret generic fleetbook-secrets \
 --from-literal=DATABASE_URL='...' --from-literal=JWT_SECRET='...' \
 --from-literal=POSTGRES_USER='fleetbook' --from-literal=POSTGRES_PASSWORD='...' \
 --from-literal=POSTGRES_DB='fleetbook'
kubectl apply -f k8s/
kubectl -n fleetbook get pods,svc,ingress
echo "127.0.0.1 fleetbook.local" | sudo tee -a /etc/hosts
# → http://fleetbook.local
```

### Étape 6 — Observabilité (bonus, 20 min)
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install loki grafana/loki-stack -n observability --create-namespace
helm install kube-prom prometheus-community/kube-prometheus-stack -n observability
kubectl apply -f k8s/50-observability.yaml
```

---

## 6. Déploiement — résumé des options
| Option | Commande | Usage |
|---|---|---|
| Dev (soutenance) | `npm run dev` | Démo prof, hot-reload |
| Prod locale | `npm run build && npm run start` | Test perf |
| Docker Compose | `docker compose up --build` | Équivalent 3 pods sans K8s |
| K8s | `kubectl apply -f k8s/` | Cible officielle Zone 4 |
| CI/CD | `git push origin main` | Zones 2→3→4 automatiques |

---

## 7. Tests & scénario de soutenance (5 minutes chrono)

1. **Catalogue (30s) :** montrer recherche « Tesla », filtre SUV, 8 véhicules.
2. **Client (1 min) :** inscription → détail Peugeot 3008 → dates → « 195 € » → Mes réservations → annuler.
3. **Admin (1 min) :** login admin → KPI → passer réservation en `confirmee` → ajouter un véhicule → le voir dans le catalogue.
4. **API (30s) :** `GET /api/vehicles`, `GET /api/stats` (403 si client).
5. **Attaque fictive (1 min 30, point fort) :**
   - Injection : `{"email":"admin@fleetbook.local' OR 1=1--","password":"x"}` → « Email ou mot de passe incorrect », rien ne fuit (paramétré + log assaini).
   - Brute force : 20 mauvais logins → alerte Grafana `LoginBruteForceSuspecte` → expliquer Détecter>Contenir>Éradiquer>Rétablir>Enseignements.
6. **K8s (30s) :** `kubectl get pods -n fleetbook` (3 Running), `describe networkpolicy`, Kyverno qui rejette un pod `:latest`.

---

## 8. Observabilité et réponse à incident
- **Logs :** `{"service":"fleetbook-backend","event":"login_failed",...}` → Loki → Grafana. Aucun hash/token.
- **Métriques :** requêtes/min, erreurs 5xx, réservations par statut, échecs login.
- **Alertes :** `LoginBruteForceSuspecte` (>0.2 échec/s pendant 2 min), `ErreursApiElevees`.
- **Plan :** Détecter (Grafana) → Contenir (NetworkPolicy / scale to 0 / rotate JWT_SECRET) → Éradiquer (patch + Trivy) → Rétablir (rollout + restore PVC) → Enseignements (post-mortem, règle Kyverno/Semgrep).

---

## 9. Conclusion et perspectives
Le site front+back exigé est livré, testé et déployable en 4 modes (dev, prod, Docker, K8s) avec pipeline sécurisée complète. Les apports principaux : RBAC réel, anti double-réservation, images/K8s durcis, secrets hors git, traçabilité sans données sensibles.
**Perspectives :** paiement fictif Stripe, upload photos (S3), tests Jest/Playwright, signature Cosign, Falco runtime, multilinguisme FR/AR/EN.

---

## 10. Annexes
- **Accès :** dev `http://localhost:3000`, K8s `http://fleetbook.local`, Grafana `port-forward 3001:80`.
- **Variables :** `DATABASE_URL`, `JWT_SECRET` (+ `POSTGRES_*` en K8s) — fictives en TP, via GitLab variables puis Secrets K8s.
- **Santé :** `GET /api/health` → `{"ok":true}` ; `npx next typegen && tsc --noEmit && npm run build` tous verts.
- **Données :** 100 % fictives pour TP ; aucun secret dans git (vérifié Gitleaks).

*Fin du rapport — bon courage pour la soutenance FleetBook ! 🚀*
