# FleetBook Next.js — sept défauts intentionnels (« avant »)

**Application volontairement vulnérable, à utiliser uniquement en local.** Toutes les identités, clés et mots de passe sont fictifs. Exécuter ces vérifications **uniquement** sur votre VM de test, via `http://127.0.0.1:8081` sur Ubuntu. Ne jamais exposer le port à Internet. Les lignes correspondent au commit de ce bloc ; les marqueurs `VULN-xx` permettent de retrouver les emplacements si le code change.

Préparer une session fictive sans afficher le JWT (sur Ubuntu, dans le même terminal) :

```bash
BASE=http://127.0.0.1:8081
CLIENT=$(mktemp); ADMIN=$(mktemp)
chmod 600 "$CLIENT" "$ADMIN"
trap 'rm -f "$CLIENT" "$ADMIN"' EXIT
curl -fsS -c "$CLIENT" -H 'Content-Type: application/json' -d '{"email":"client@fleetbook.local","password":"Client123!"}' "$BASE/api/auth/login" >/dev/null
curl -fsS -c "$ADMIN" -H 'Content-Type: application/json' -d '{"email":"admin@fleetbook.local","password":"Admin123!"}' "$BASE/api/auth/login" >/dev/null
```

| ID | Emplacement (fichier : ligne) | Cause / impact | OWASP 2021 | Preuve inoffensive sur votre VM seulement | Correction prévue |
|---|---|---|---|---|---|
| VULN-01 | `src/lib/auth.ts:56-62`, `src/app/api/vehicles/route.ts:17-21` | SQL concaténé dans login et recherche ; les résultats peuvent être modifiés. bcrypt reste vérifié au login. | A03 Injection | `curl -sG --data-urlencode "q=%' OR 1=1 -- " "$BASE/api/vehicles"` renvoie les 8 véhicules, même sans terme de recherche réel. Comparer avec `q=Impossible123`. | Utiliser `eq`/`ilike` Drizzle ou `$1` de pg. |
| VULN-02 | `src/app/api/reservations/[id]/route.ts:7-16` | GET par ID sans vérifier `userId` ; lecture d'une réservation d'autrui. | A01 Broken Access Control | Créer une réservation **fictive** avec `$ADMIN`, puis demander son ID avec le cookie `$CLIENT` : GET `/api/reservations/ID` retourne l'objet. | Ajouter `userId` à la condition ou autoriser explicitement un admin. |
| VULN-03 | `src/app/api/vehicles/[id]/route.ts:31-39` | DELETE vérifie la session, pas le rôle ; un client peut supprimer un véhicule. | A01 Broken Access Control | Créer un véhicule **jetable** via l'API en admin, le supprimer avec `$CLIENT`, puis recréer le jeu de test si besoin. Ne pas supprimer un véhicule du seed. | Vérifier `session.role === 'admin'` avant DELETE. |
| VULN-04 | `src/db/schema.ts:64`, `src/app/api/reservations/[id]/note/route.ts:8-18`, `src/app/dashboard/page.tsx:91-92` | Note stockée, puis injectée dans `dangerouslySetInnerHTML` ; XSS stockée sur le tableau du client. | A03 Injection | Ajouter à **sa propre** réservation une note `<img src=x onerror="document.body.dataset.poc='vuln04'">` ; après chargement du tableau, `document.body.dataset.poc` vaut `vuln04` (aucune exfiltration). | Afficher le texte directement avec React, sans HTML brut. |
| VULN-05 | `src/lib/training-config.ts:1-6`, `src/lib/auth.ts:5,26-32` | Faux secret JWT et fausse clé API commis dans le code ; sur un vrai service, signature de JWT exposée. L'ancienne variable `JWT_SECRET` du Compose n'est pas utilisée par cette variante. | A02 Cryptographic Failures / A05 | `gitleaks dir --config .gitleaks.toml --redact=100 .` signale les faux secrets ; ne pas afficher les valeurs trouvées. | Injecter un secret à l'exécution, renouveler les jetons ; supprimer la fausse clé. |
| VULN-06 | `package.json:19`, `src/lib/training-config.ts:3-4` | `lodash@4.17.20`, ancienne version associée à **CVE-2021-23337** ; pas de route exploitant `_.template`. | A06 Vulnerable Components | `npm audit` ou `trivy fs --scanners vuln .` signale la dépendance (niveau HIGH selon l'avis). | Mettre à jour lodash et le lockfile, relancer l'analyse. |
| VULN-07 | `next.config.ts:5-12`, `src/app/api/vehicles/route.ts:33-36`, `src/app/api/auth/login/route.ts:11,30-31` | CORS `*`, piles d'erreurs exposées, pas de CSP ajouté, pas de limite de tentatives login. | A05 Security Misconfiguration | `curl -i -H 'Origin: https://example.invalid' "$BASE/api/health"` montre CORS `*` ; une recherche contenant uniquement `'` déclenche un JSON avec `stack`. | Limiter les origines, en-têtes de sécurité, erreurs génériques, limitation de login. |

## Préparer les objets de test sans toucher aux données seedées

```bash
# Réservation d'un admin (VULN-02), sans chevauchement avec le seed :
RID=$(curl -fsS -b "$ADMIN" -H 'Content-Type: application/json' -d '{"vehicleId":1,"startDate":"2030-08-01","endDate":"2030-08-02"}' "$BASE/api/reservations" | python3 -c 'import json,sys;print(json.load(sys.stdin)["reservation"]["id"])')
curl -fsS -b "$CLIENT" "$BASE/api/reservations/$RID"

# Véhicule jetable (VULN-03) :
VID=$(curl -fsS -b "$ADMIN" -H 'Content-Type: application/json' -d '{"brand":"Demo","model":"Jetable","year":2030,"licensePlate":"FICTIF-JET-999","pricePerDay":"1.00"}' "$BASE/api/vehicles" | python3 -c 'import json,sys;print(json.load(sys.stdin)["vehicle"]["id"])')
curl -fsS -X DELETE -b "$CLIENT" "$BASE/api/vehicles/$VID"
```

Pour VULN-04, créer d'abord une réservation client sur le véhicule 2 à une autre date. Ne coller aucun jeton ou mot de passe réel dans les preuves. Supprimer les cookies temporaires en quittant le shell. Le seed réutilise les mêmes utilisateurs fictifs : il **ne supprime pas** les réservations créées pour les démonstrations. Les nettoyer manuellement ou réinitialiser **uniquement** le nouveau volume Docker d'exercice si nécessaire.

**Limites de la preuve CI :** Semgrep et Gitleaks doivent rendre la branche vulnérable rouge. La politique Trivy bloque `CRITICAL` ; l'avis lodash cité est `HIGH` et peut donc être signalé sans bloquer à lui seul. Les versions de scanners et bases d'avis évoluent : ne jamais inventer un résultat de scan. Le déploiement automatique et ZAP attendent un cluster local vérifié.
