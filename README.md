# FleetBook — version Next.js (migration)

**Application pédagogique : données fictives, machine personnelle uniquement.** Cette version remplace l'ancienne application Express/nginx dans la branche courante ; l'ancienne reste consultable dans l'historique Git. Ne jamais fusionner les anciennes tables avec celles de Drizzle.

## Ce qui est déjà vérifié

Code importé depuis le dossier Drive de l'étudiant : Next.js 16 / React 19 / Tailwind 4, routes API Next.js, Drizzle + PostgreSQL 16, session JWT en cookie httpOnly. Vérifiés dans l'espace de travail : `npm test`, `npm run lint` (2 avertissements d'images), `npm run typecheck`, `npm run build`. Le build Docker, la migration Drizzle, le seed (3 utilisateurs et 8 véhicules) et `/api/health` ont été vérifiés sur la VM par l'étudiant **avant l'ajout des défauts** ; cette variante doit être reconstruite et revalidée. Le projet Drive n'avait ni `package-lock.json` ni dossier `public` : ajoutés pour permettre `npm ci` et le Dockerfile.

Le catalogue, l'inscription utilisateur, la réservation, le tableau client et l'administration viennent du dossier Drive. Le seed comporte 3 comptes et 8 véhicules fictifs. Le rôle admin ne peut pas être choisi lors de l'inscription publique. La connexion à la base utilise une variable d'environnement ; les valeurs de `.env.example` sont factices. Les **sept défauts de formation VULN-01 à VULN-07** sont désormais replantés et marqués dans le code Next.js. Les anciennes preuves Express ne s’appliquent pas : utiliser [docs/vulnerabilites.md](docs/vulnerabilites.md) et [docs/stride.md](docs/stride.md). Sur cette variante vulnérable, le faux secret JWT est volontairement en dur : la variable `JWT_SECRET` de `.env.example` n’est pas utilisée par l’authentification. Aucune vraie clé ni vraie donnée personnelle.

## Démarrage isolé avec Docker sur Ubuntu

Utiliser le dépôt cloné sur la VM, depuis sa racine. L'ancien Compose peut rester actif : cette version utilise un autre projet Docker, un autre volume et le port **8081**, sans réutiliser sa base. Ces commandes créent et alimentent uniquement la base `fleetbook_next` du nouveau conteneur.

```bash
cd ~/FleetBook
git pull origin arena/c5cd84fe-fleetbook
# Préserver l'ancien .env local avant de créer la configuration Next.js.
if [ -f .env ]; then mv .env .env.previous-express; fi
cp .env.example .env
sudo docker compose config --quiet
sudo docker compose up -d db
sudo docker compose --profile tools build migrate
sudo docker compose --profile tools run --rm migrate
sudo docker compose up -d --build app
sudo docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < scripts/seed.sql
sudo docker compose ps
curl -fsS http://127.0.0.1:8081/api/health
curl -fsS http://127.0.0.1:8081/api/vehicles
```

Résultat attendu **à confirmer sur la VM** : `{"ok":true}`, liste de 8 véhicules et conteneurs sains. `docker compose run migrate` doit finir sans erreur avant de lancer l'app. La commande seed peut être rejouée sans recréer les mêmes véhicules ; elle rétablit les mots de passe de démonstration. `docker compose down` garde le volume ; **`docker compose down -v` efface uniquement le volume de cette nouvelle version**. Ne pas employer `-v` si des données de démonstration doivent être conservées.

### Comptes de démonstration

- `admin@fleetbook.local` / `Admin123!`
- `client@fleetbook.local` / `Client123!`

Vérifier sans exposer les mots de passe dans les journaux :

```bash
curl -i http://127.0.0.1:8081/api/health
sudo docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM users; SELECT count(*) FROM vehicles;"'
sudo docker compose exec -T app id
sudo docker compose logs --tail=60 app
```

Depuis **Windows PowerShell** (pas depuis Ubuntu), maintenir ce tunnel SSH ouvert :

```powershell
ssh -p 2222 -N -L 8081:127.0.0.1:8081 ubuntu@127.0.0.1
```

Tester dans un autre PowerShell : `curl.exe http://127.0.0.1:8081/api/health`. Si le port 8081 est occupé sur Windows, utiliser `-L 8082:127.0.0.1:8081` et tester Windows sur 8082. Sur une VM avec peu de RAM, ne pas lancer kind, Trivy et le build Next.js simultanément ; consulter `free -h` et `sudo docker compose logs --tail=100` si un conteneur ne démarre pas.

## Pipeline GitLab

`.gitlab-ci.yml` conserve les **contrôles bloquants** de la précédente pipeline et les adapte à Next.js et au Runner **shell local** (`fleetbook-local`) : build, test/lint/typecheck, Semgrep, Gitleaks, Trivy fs, construction et scan de l'image, push, déploiement, ZAP. La politique est dans `docs/politique_blocage.md`. Les jobs deploy/DAST restent conditionnels : les manifestes K8s téléchargés du Drive **ne sont pas validés** et aucun déploiement n'est prétendu. Les fichiers `GUIDE-UBUNTU.md` et `RAPPORT-FleetBook.md` proviennent du Drive ; les commandes de cette page font foi pour la version migrée.

Le projet GitLab.com de formation refuse de lancer des jobs sans vérification du compte ; aucune carte bancaire n'est requise pour la solution de repli : **`.github/workflows/security.yml`** lance les mêmes barrières de sécurité sur des machines temporaires GitHub. Le dépôt GitHub est public : ne jamais y connecter la VM comme Runner auto-hébergé. La VM garde son GitLab Runner shell pour un éventuel serveur GitLab local ultérieur. La pipeline GitHub ne déploie pas sur kind : ce bloc sera traité séparément, avec une connexion locale privée et validée. Les alertes Semgrep et Gitleaks doivent rendre cette variante « avant » rouge ; le correctif « après » ne doit pas modifier le point de référence vulnérable. Ne jamais mettre de jeton GitLab ni de vraie clé dans le dépôt.

## Reconstruire cette variante « avant » sur la VM existante

La migration ajoute une colonne `note` avec valeur par défaut ; les réservations existantes restent en place. **Ne pas supprimer le volume PostgreSQL.** Depuis Ubuntu :

```bash
cd ~/FleetBook
git pull origin arena/c5cd84fe-fleetbook
sudo docker compose --profile tools build migrate
sudo docker compose --profile tools run --rm migrate
sudo docker compose up -d --build app
sudo docker compose ps
curl -fsS http://127.0.0.1:8081/api/health
```

Après ce contrôle, utiliser uniquement les comptes et données fictifs de `docs/vulnerabilites.md` pour les preuves « avant ». La compilation de l'image Next.js et le téléchargement de la base Trivy peuvent utiliser beaucoup de mémoire : ne pas lancer kind, ZAP et le build simultanément. **Ne pas modifier cette version avant de conserver les preuves nécessaires.** Les jobs SAST et secrets de GitLab sont censés être rouges ; ce n'est pas un échec imprévu.
