# STRIDE — FleetBook Next.js (résumé de formation)

| STRIDE | Scénario fictif local | VULN | OWASP Top 10 (2021) |
|---|---|---|---|
| S — Usurpation | JWT signé avec une clé factice connue. | 05 | A02 / A05 |
| T — Altération | Suppression d'un véhicule jetable par un client ; SQL concaténé. | 03, 01 | A01, A03 |
| R — Répudiation | Une suppression sans contrôle de rôle rend l'attribution difficile. | 03 | A01 |
| I — Divulgation | GET d'une réservation tierce ; pile SQL affichée. | 02, 07 | A01, A05 |
| D — Déni de service | Connexion sans limitation ; composant ancien à auditer. | 07, 06 | A05, A06 |
| E — Élévation | Session client agissant sur DELETE ; XSS sur une session de test. | 03, 04 | A01, A03 |

Le tableau est une analyse de menaces, pas la preuve d'exploitation de chaque scénario. Ne tester que sa VM personnelle.
