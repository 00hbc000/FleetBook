# STRIDE — FleetBook (résumé)

**Périmètre :** navigateur → API Express (JWT) → PostgreSQL ; développement local uniquement, données fictives. Chaque menace renvoie à une vulnérabilité documentée et à OWASP Top 10 (2021).

| STRIDE | Exemple local | VULN | OWASP |
|---|---|---|---|
| S — Usurpation | Secret JWT factice en dur pouvant servir à signer un jeton. | 05 | A02 / A05 |
| T — Altération | Un utilisateur supprime un véhicule via DELETE ; SQL concaténé modifie une requête. | 03, 01 | A01, A03 |
| R — Répudiation | Sans traces de sécurité dédiées, une suppression est difficile à attribuer après coup. | 03 (effet) | A01 |
| I — Divulgation | IDOR révèle une réservation tierce ; erreurs détaillées révèlent la pile. | 02, 07 | A01, A05 |
| D — Déni de service | Connexion sans limite de tentatives ; dépendance obsolète à auditer. | 07, 06 | A05, A06 |
| E — Élévation de privilèges | Contrôle de rôle absent ; XSS stockée peut agir dans une session victime. | 03, 04 | A01, A03 |

Ce tableau est un modèle pédagogique de menaces, non une preuve que tous les scénarios sont exploités par l'interface.
