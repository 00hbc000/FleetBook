# FleetBook — location de véhicules (Next.js, version sécurisée)

Application pédagogique : données fictives, machine personnelle uniquement.
Next.js 16 / React 19 / Tailwind 4, routes API Next.js, Drizzle + PostgreSQL 16, session JWT en cookie httpOnly.

## Branches

- vulnerable : baseline pédagogique avec les sept défauts VULN-01 à VULN-07 (docs/vulnerabilites.md).
- secure : les sept défauts sont corrigés, la CI est verte.
- main : version finale sécurisée.

## Démarrage local avec Docker (Ubuntu)

    cp .env.example .env
    openssl rand -hex 32   # générer JWT_SECRET (32 caractères minimum) dans .env
    docker compose up -d db
    docker compose --profile tools run --rm migrate
    docker compose up -d --build app
    docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < scripts/seed.sql
    curl -fsS http://127.0.0.1:8081/api/health

L'application écoute uniquement sur 127.0.0.1:8081.

### Comptes fictifs

- admin@fleetbook.local / Admin123!
- client@fleetbook.local / Client123!

## CI GitHub (contrôles bloquants)

.github/workflows/security.yml exécute sur des machines temporaires GitHub : build/tests/lint, Semgrep (ERROR), Gitleaks (secrets), Trivy fs (CRITICAL), puis construction et scan de l'image (Trivy CRITICAL). L'image n'est publiée nulle part pour l'instant : la cible est ECR (AWS). Politique détaillée : docs/politique_blocage.md.

## Sécurité

- Correctifs des sept défauts : docs/vulnerabilites.md, section « Après ».
- Secret JWT injecté par la variable d'environnement JWT_SECRET, jamais dans le code.
- Analyse STRIDE : docs/stride.md.
