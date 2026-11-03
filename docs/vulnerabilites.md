# Vulnérabilités intentionnelles — phase 1

**Application volontairement vulnérable, à utiliser uniquement en local.** Exécuter ces preuves uniquement sur votre instance de test personnelle `http://localhost:3000`, après `npm run db:seed`. Ne jamais remplacer les données fictives par de vraies données. Les lignes ci-dessous désignent les fichiers de cette phase ; si le code change, retrouver également les marqueurs `VULN-xx`.

Pour les commandes protégées ci-dessous, récupérer deux jetons de démonstration (outils locaux `curl` et `jq`) :

```bash
BASE=http://localhost:3000
ALICE=$(curl -s -X POST "$BASE/api/login" -H 'Content-Type: application/json' -d '{"email":"alice@fleetbook.test","password":"Demo123!"}' | jq -r .token)
ADMIN=$(curl -s -X POST "$BASE/api/login" -H 'Content-Type: application/json' -d '{"email":"admin@fleetbook.test","password":"Demo123!"}' | jq -r .token)
```

| ID | Emplacement (fichier : ligne) | Cause | Impact | OWASP Top 10 (2021) | Preuve locale sans dommage | Correction envisagée (phase 5) |
|---|---|---|---|---|---|---|
| VULN-01 | `backend/src/server.js:46-47`, `:61-62` | Email de connexion et recherche concaténés dans SQL. | Modifier la requête ; lire des résultats inattendus. Le mot de passe reste vérifié par bcrypt dans la connexion. | A03 Injection | `curl -G --data-urlencode "search=%' OR 1=1 -- " "$BASE/api/vehicles"` renvoie les 10 véhicules. Pour la connexion : email `admin@fleetbook.test' -- ` avec le mot de passe fictif connu retourne l'admin alors que cet email n'existe pas. | Paramètres `$1` de `pg`, y compris pour `ILIKE`, plus tests de régression. |
| VULN-02 | `backend/src/server.js:111-117` | GET par id ne compare pas `user_id` au JWT. | Un utilisateur lit une réservation d'un autre. | A01 Broken Access Control | `curl -H "Authorization: Bearer $ALICE" "$BASE/api/bookings/2"` renvoie la réservation fictive de Benoît. | Ajouter `AND b.user_id=$2`, sauf accès admin autorisé explicitement. |
| VULN-03 | `backend/src/server.js:85-92` | DELETE vérifie le JWT mais pas le rôle admin. | Un utilisateur peut supprimer un véhicule non réservé. | A01 Broken Access Control | Après seed, `curl -X DELETE -H "Authorization: Bearer $ALICE" "$BASE/api/vehicles/10"` renvoie `{"deleted":10}`. Relancer le seed pour restaurer. | Insérer `requireAdmin` avant la route ; test de refus 403. |
| VULN-04 | `frontend/app.js:66-67` (`backend/src/server.js:128-134` stocke la note) | Note conservée puis injectée dans `innerHTML` sans échappement. | JavaScript stocké s'exécute lors de l'affichage de « Mes réservations » ou « Toutes les réservations ». | A03 Injection | Sur la réservation 1 d'Alice, envoyer `{"note":"<img src=x onerror=\"document.body.dataset.poc='vuln04'\">"}` à `POST /api/bookings/1/note` avec `$ALICE`, puis ouvrir l'interface et lire `document.body.dataset.poc` dans la console (aucune exfiltration). | Afficher avec `textContent`, éventuellement nettoyer le HTML autorisé. |
| VULN-05 | `backend/src/config.js:2-5`, `.gitleaks.toml:8-12` | Faux secret JWT et fausse clé API dans le dépôt. | Dans un vrai projet, usurpation de jetons / fuite de clés ; ici aucune vraie clé. | A02 Cryptographic Failures / A05 Security Misconfiguration | `gitleaks dir --config .gitleaks.toml .` signale les chaînes factices grâce à la règle du dépôt ; ou `grep FAKE_ backend/src/config.js`. | Secrets depuis le gestionnaire de secrets / variables d'environnement ; rotation si fuite réelle. |
| VULN-06 | `backend/package.json:16`, `backend/src/server.js:5` | `lodash@4.17.20` verrouillé ; CVE-2021-23337 (GHSA-35jh-r3h4-6jhm, injection de commande dans `_.template`). | Risque dans le composant vulnérable si cette API est utilisée avec des entrées non fiables ; **l'application ne fournit pas de route exploitant `_.template`**. | A06 Vulnerable and Outdated Components | Dans `backend/`, `npm audit` signale `lodash` (d'autres avis peuvent aussi apparaître) ; Trivy peut scanner le lockfile. | Mettre à jour vers une version corrigée et reconstruire le lockfile ; relancer les scanners. |
| VULN-07 | `backend/src/server.js:12-19`, `:138-142` | CORS `*`, piles d'erreur visibles, pas de headers de sécurité ni de limitation sur login. | Appels cross-origin, informations techniques exposées, tentatives répétées. | A05 Security Misconfiguration | `curl -i -H 'Origin: https://example.invalid' "$BASE/api/vehicles"` montre `Access-Control-Allow-Origin: *` ; une erreur SQL de recherche locale affiche `stack`. | Origines autorisées explicitement, `helmet`, erreurs génériques, limitation de login. |

Exemple de requête XSS locale (n'utilise que la réservation fictive d'Alice) :

```bash
curl -X POST "$BASE/api/bookings/1/note" \
  -H "Authorization: Bearer $ALICE" -H 'Content-Type: application/json' \
  -d '{"note":"<img src=x onerror=\"document.body.dataset.poc=\u0027vuln04\u0027\">"}'
```

Le navigateur doit afficher la réservation après reconnexion ou actualisation pour déclencher la preuve. Réinitialiser avec `npm run db:seed`. Les valeurs `FAKE_...` et `Demo123!` ne sont pas des secrets de production. La règle Gitleaks personnalisée est nécessaire car un scanner générique peut ignorer les valeurs clairement fictives. Ne pas employer ces preuves contre d'autres systèmes.
