# Observabilite (zone 5)

## Objectif
Surveiller l'application deployee dans le cluster kind : metriques, logs et
visualisation, en acces 100 % local (port-forward).

## Architecture
- Namespace dedie `monitoring` : l'application et ses NetworkPolicies ne sont
  pas modifiees.
- **Prometheus** (v3.16.0) : scrape les noeuds et cAdvisor (CPU/memoire par
  pod) via le proxy de l'API Kubernetes — aucun flux direct vers fleetbook.
- **Loki** (v3.7.9) : stockage des logs (binaire unique, emptyDir — labo).
- **Promtail** (v3.6.11) : DaemonSet qui lit /var/log/pods et pousse vers Loki.
- **Grafana** (13.2.3) : sources de donnees et dashboard provisionnes par
  ConfigMaps (dashboards-as-code).

## Choix techniques
| Sujet | Decision | Justification |
|---|---|---|
| Version Promtail | 3.6.11 (finale, EOL mars 2026) | spec du projet ; successeur officiel : Grafana Alloy (evolution future) |
| Stockage | emptyDir | labo local ; en production : PVC et retention |
| readOnlyRootFilesystem Grafana | desactive (exception documentee) | Grafana 13 installe et met a jour ses plugins de sources de donnees au demarrage (processus externes) |
| Scrape Prometheus | via l'API Kubernetes | aucune ouverture reseau dans le namespace fleetbook |

## Defauts corriges pendant l'integration
1. Promtail 3.x n'assigne plus `__path__` pour `role: pod` : construction
   explicite du chemin dans relabel_configs.
2. Promtail filtre les pods par `spec.nodeName` via la variable HOSTNAME :
   sans elle, il utilise le nom du pod et ne decouvre rien (silencieusement).
   Correctif : env HOSTNAME depuis fieldRef spec.nodeName.
3. Grafana 13 ne supporte pas un filesystem racine en lecture seule pour ses
   plugins : exception documentee.

## Verifications
- Cibles Prometheus : prometheus / kubernetes-nodes / kubernetes-cadvisor up.
- Promtail : 17 fichiers actifs, 1957 entrees envoyees.
- Requete Loki `{namespace="fleetbook"}` : lignes de logs de l'application.
- Requetes Prometheus et Loki via l'API Grafana : status success.
- Dashboard : CPU par pod, memoire par pod, logs en direct.

## Acces
```bash
kubectl -n monitoring port-forward svc/grafana 3000:3000
# puis http://localhost:3000/d/fleetbook
# mot de passe admin : secret grafana-admin (affiche a sa creation)
