# FleetBook — phases 1 et 2 (Milestones 2 et 3)

**Application volontairement vulnérable, à utiliser uniquement en local.**

FleetBook est un exercice DevSecOps de réservation de véhicules (TEK-UP, ING-5-SSIR). Toutes les personnes, immatriculations, téléphones, permis, clés et mots de passe fournis sont **fictifs**. Ne pas publier ce service sur Internet et ne pas utiliser de données ou secrets réels. Les sept familles de défauts sont décrites dans [docs/vulnerabilites.md](docs/vulnerabilites.md), avec un modèle [STRIDE](docs/stride.md). Le projet est à corriger plus tard, après les preuves avant/après.

## Arborescence complète (hors dépendances installées)

```text
FleetBook/
├── .gitignore
├── .env.example
├── .gitleaks.toml
├── docker-compose.yml
├── README.md
├── backend/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── test/
│   │   └── api.test.js
│   ├── db/
│   │   ├── schema.sql
│   │   ├── init.js
│   │   └── seed.js
│   └── src/
│       ├── auth.js
│       ├── config.js
│       ├── db.js
│       └── server.js
├── frontend/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── style.css
│   └── app.js
└── docs/
    ├── vulnerabilites.md
    └── stride.md
```

## Lancer maintenant (sans Docker, phase 1)

Pré-requis : Node.js 20+ / npm et PostgreSQL installé et démarré **sur votre machine**. Sur Linux avec PostgreSQL local neuf :

```bash
sudo -u postgres psql -c "CREATE USER fleetbook WITH PASSWORD 'fleetbook';"
sudo -u postgres createdb -O fleetbook fleetbook
export DATABASE_URL='postgres://fleetbook:fleetbook@localhost:5432/fleetbook'
cd backend
npm ci
npm run db:seed
npm start
```

Ouvrir **http://localhost:3000** sur cette même machine. `npm run db:init` crée uniquement les tables si besoin ; `npm run db:seed` les crée aussi et **efface puis recrée** les données de démonstration. Si le rôle ou la base existent déjà, ignorer seulement leur commande de création. Si votre PostgreSQL local utilise une autre connexion, définir `DATABASE_URL` avant `npm run db:seed` et `npm start` (exemple fictif par défaut : `postgres://fleetbook:fleetbook@localhost:5432/fleetbook`). `DATABASE_URL` est obligatoire pour la base ; `PORT` est optionnel (3000 par défaut). Le mode sans Docker reste disponible : Express sert les fichiers HTML/CSS/JS en local. Avec Docker, nginx les sert à la place.

Vérification de syntaxe et tests API sans base : `cd backend && npm test`. Vérification de la dépendance : `cd backend && npm audit` (résultat non nul **attendu**). Pour VULN-05, configurer Gitleaks avec `gitleaks dir --config .gitleaks.toml .` ; pour scanner aussi l'historique Git : `gitleaks git --config .gitleaks.toml .` (selon la version de Gitleaks). Les chaînes fictives ne déclenchent pas nécessairement les règles standard sans cette configuration.

## Comptes de test (100 % fictifs)

Même mot de passe pour tous : `Demo123!` — **ne jamais le réutiliser ailleurs**.

| Rôle | Email | Téléphone | Permis |
|---|---|---|---|
| admin | admin@fleetbook.test | 0000000001 | FICTIF-PERMIS-001 |
| user | alice@fleetbook.test | 0000000002 | FICTIF-PERMIS-002 |
| user | benoit@fleetbook.test | 0000000003 | FICTIF-PERMIS-003 |
| user | chloe@fleetbook.test | 0000000004 | FICTIF-PERMIS-004 |
| user | dina@fleetbook.test | 0000000005 | FICTIF-PERMIS-005 |

Il y a 10 véhicules (`DEMO-001` à `DEMO-010`) et 3 réservations de départ. L'inscription crée toujours un compte `user`. La connexion rend un JWT de 2 h ; le navigateur conserve ce jeton en session.

## API minimale

| Méthode et chemin | Usage | Accès prévu |
|---|---|---|
| POST `/api/register`, POST `/api/login` | inscription, connexion | public |
| GET `/api/vehicles?search=...` | liste / recherche | public |
| POST `/api/vehicles`, PUT `/api/vehicles/:id` | ajout / modification | admin |
| DELETE `/api/vehicles/:id` | suppression | admin prévu, **VULN-03** |
| GET `/api/users`, GET `/api/bookings` | toutes les données | admin |
| POST `/api/bookings`, GET `/api/bookings/my` | réserver / mes réservations | connecté |
| GET `/api/bookings/:id` | détail | propriétaire prévu, **VULN-02** |
| POST `/api/bookings/:id/note` | ajouter une note personnelle | propriétaire |

Pour les routes protégées : `Authorization: Bearer <jeton>`. Les réservations d'un véhicule existant empêchent sa suppression par la contrainte SQL ; pour tester DELETE, utiliser `DEMO-010` (id 10) après un nouveau seed.

## Lancer avec Docker Compose (phase 2, VM locale seulement)

Pré-requis : Docker et le plugin `docker compose` v2, avec accès au démon Docker. Depuis la racine `FleetBook/` :

```bash
cp .env.example .env
docker compose config --quiet
docker compose build
docker compose up -d --wait
docker compose exec -T backend npm run db:seed
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/api/vehicles
```

`docker compose ps` doit montrer les trois services **healthy** ; l'API retourne dix véhicules après le seed. L'interface est servie sur **http://127.0.0.1:8080**, uniquement sur l'hôte Docker. Depuis Windows via le SSH existant : `ssh -p 2222 -L 8080:127.0.0.1:8080 ubuntu@127.0.0.1` dans un terminal dédié, puis `curl http://127.0.0.1:8080/health` dans un autre terminal Windows. Le tunnel doit rester ouvert. Pas de port PostgreSQL ni backend publié. La configuration `.env` est ignorée par Git et contient seulement un mot de passe **fictif** pour la VM ; aucune vraie valeur n'est copiée dans les images. Les valeurs `FAKE_JWT_SECRET_FOR_TRAINING` et `FAKE_API_KEY_FOR_TRAINING` restent volontairement dans l'image backend pour l'exercice VULN-05 (ce ne sont **pas** des secrets réels).

Le premier seed efface et recrée les données d'exercice. Le volume nommé `pgdata` conserve la base après `docker compose down`. **Attention :** `docker compose down -v` efface le volume et toutes les données. Si un ancien serveur Phase 1 occupe le port 3000, il n'interfère pas avec le port 8080. Sur une VM avec peu de RAM, le build ou PostgreSQL peuvent échouer : vérifier `free -h`, `docker compose ps` et `docker compose logs --tail=100`; arrêter les autres services gourmands avant de relancer. Éviter deux bases PostgreSQL concurrentes si la VM manque de mémoire.

### Preuves pour le rapport (commandes terminal)

```bash
docker compose ps
docker compose exec -T backend id
docker compose exec -T frontend id
docker compose exec -T db id
docker compose exec -T backend sh -c 'test ! -e /app/.git && test ! -e /app/.env && echo "Pas de .git ni de .env dans l image"'
curl -i http://127.0.0.1:8080/health
curl -s http://127.0.0.1:8080/api/vehicles
```

Capturer les sorties montrant : images construites, trois états healthy, UID non nul dans chaque conteneur, absence de `.git` et `.env`, réponse santé `200`, liste de dix véhicules et une connexion avec les comptes fictifs. `docker compose images` montre les images construites. Ne jamais capturer un vrai secret dans une capture d'écran.

**Phases suivantes, sur demande seulement :** CI GitLab, Kubernetes kind, corrections sur une autre branche et DAST. Les défauts VULN-01 à VULN-07 restent présents ici.
