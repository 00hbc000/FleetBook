# Analyse DAST — OWASP ZAP

## Méthode
- Outil : OWASP ZAP, scan passif (baseline), image Docker officielle.
- Cible : http://127.0.0.1:8081 — application dans le cluster kind (accès local uniquement).
- Commande : `./scripts/zap-scan.sh`
- Boucle DevSecOps : scan → tri → correction → redéploiement → rescan.

## Scan 1 (image ce5fe6c)
0 FAIL · 4 WARN · 64 PASS

## Tri des alertes
| Alerte | Décision | Traitement |
|---|---|---|
| X-Powered-By divulgué (10037) | Corrigée | `poweredByHeader: false` (PR #9) |
| COOP/CORP/COEP absents (90004) | Corrigée | en-têtes ajoutés dans next.config.ts (PR #9) |
| CSP script-src unsafe-inline (10055) | Acceptée | scripts/styles inline requis par Next.js sans gestion de nonce ; amélioration future : CSP avec nonce |
| Contenu non stockable (10049) | Acceptée | informatif (pages 404), aucun risque |

## Scan 2 (image b225a92)
0 FAIL · 2 WARN (les 2 acceptées) · 66 PASS

Vérification :
curl -sI http://127.0.0.1:8081/ | grep -iE '^x-powered|^cross-origin'
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp

## Conclusion
Alertes actionnables : toutes corrigées. Les 2 alertes restantes sont documentées et acceptées (risque faible, contexte local HTTP).
