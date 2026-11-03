# FleetBook — phase 1 (Milestone 2)

**Application volontairement vulnérable, à utiliser uniquement en local.**

FleetBook est un exercice DevSecOps de réservation de véhicules (TEK-UP, ING-5-SSIR). Toutes les personnes, immatriculations, téléphones, permis, clés et mots de passe fournis sont **fictifs**. Ne pas publier ce service sur Internet et ne pas utiliser de données ou secrets réels. Les sept familles de défauts sont décrites dans [docs/vulnerabilites.md](docs/vulnerabilites.md), avec un modèle [STRIDE](docs/stride.md). Le projet est à corriger plus tard, après les preuves avant/après.

## Arborescence complète de la phase 1

```text
FleetBook/
├── .gitignore
├── .gitleaks.toml
├── README.md
├── backend/
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
cd backend
npm ci
npm run db:seed
npm start
```

Ouvrir **http://localhost:3000** sur cette même machine. `npm run db:init` crée uniquement les tables si besoin ; `npm run db:seed` les crée aussi et **efface puis recrée** les données de démonstration. Si le rôle ou la base existent déjà, ignorer seulement leur commande de création. Si votre PostgreSQL local utilise une autre connexion, définir `DATABASE_URL` avant `npm run db:seed` et `npm start` (exemple fictif par défaut : `postgres://fleetbook:fleetbook@localhost:5432/fleetbook`). `PORT` est optionnel (3000 par défaut). Aucun conteneur n'est nécessaire à cette phase. Express sert les fichiers HTML/CSS/JS en local ; la phase 2 confiera leur service à nginx et ajoutera Docker Compose.

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

**Phases suivantes :** phase 2 = Dockerfiles, `.dockerignore`, nginx et `docker-compose.yml` ; phase 3 = CI GitLab, Kubernetes et corrections. Aucun de ces éléments n'est créé en phase 1.
