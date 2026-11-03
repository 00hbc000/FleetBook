# Politique de blocage CI — FleetBook

**Application volontairement vulnérable, uniquement sur machines de test.** La pipeline est dans `.gitlab-ci.yml`. Le Runner shell est réservé à la VM locale. Ne jamais lui confier des projets non fiables : le groupe Docker donne pratiquement les droits root.

| Contrôle | Règle de blocage | Pourquoi |
|---|---|---|
| Semgrep (SAST) | Toute alerte **ERROR** de `.semgrep.yml` fait échouer le job. | Les règles locales ciblent SQL concaténé et insertion HTML non échappée. Pas de `allow_failure`. |
| Gitleaks (secrets) | Toute chaîne signalée (règles standard **et** règle factice du dépôt) fait échouer le job. | Même un secret de démonstration doit provoquer une alerte visible ; les rapports sont masqués à 100 %, jamais affichés dans les logs. |
| Trivy fs (dépendances) | Toute faille **CRITICAL** dans le code/dépendances fait échouer le job. | Empêcher de construire une image connue comme critique. |
| Trivy image | Toute faille **CRITICAL** dans l'une des deux images fait échouer le job. | Tenir compte aussi des couches du système de base. |
| Build, tests, push, deploy, DAST | Toute commande en échec fait échouer son job ; push et deploy ne s'exécutent qu'après scans réussis. | Ne jamais promouvoir une image dont les contrôles ont échoué. |

Les jobs `secrets` et `dependencies` ont `when: always` **uniquement pour produire leurs preuves** si un scan précédent échoue. Cela ne débloque pas `image_build`, `push` ou `deploy`. Les rapports JSON sont des artefacts conservés 7 jours. Le job secrets scanne seulement les fichiers versionnés du commit (`git archive HEAD`), pas `node_modules` ni `.env` local. Le scan d'historique Git n'est **pas** couvert par ce job.

## Ce qui est attendu sur `vulnerable`

Le dépôt contient volontairement des chaînes factices (VULN-05), des concaténations SQL (VULN-01), du HTML non échappé (VULN-04) et une dépendance ancienne (VULN-06). Il est **normal** que la pipeline soit rouge. Le job `deploy` ne doit donc **pas** s'exécuter sur `vulnerable`. On ne peut pas à la fois imposer ces contrôles bloquants et prétendre que la branche vulnérable se déploie automatiquement après eux. Pour les preuves « avant », déployer la version vulnérable **manuellement sur le cluster local isolé** au Block 3, sans qualifier cette opération de réussite de la pipeline. La pipeline verte et le déploiement automatisé ne sont attendus que sur `secure`, après corrections et configuration Kubernetes.

`deploy` reste absent tant que `k8s/namespace.yaml` et les variables GitLab protégées ne sont pas prêts (Block 3). `dast` reste absent tant que le script ZAP local n'existe pas (Block 5). Ce sont des jobs conditionnels réels, pas des résultats inventés. Les rapports ZAP ne pourront être produits qu'après déploiement sur une cible **locale** contrôlée.

## Démonstration d'une fausse fuite (uniquement après Block 4)

Sur la branche `secure` du dépôt GitLab, une fois tous les vrais contrôles au vert, lancer dans le terminal de la VM :

```bash
sh scripts/demo_blocage.sh add
# Attendre la pipeline : le job secrets doit échouer ; push/deploy ne partent pas.
sh scripts/demo_blocage.sh remove
# Attendre la nouvelle pipeline : contrôler que le job secrets passe.
```

Le script n'utilise qu'une chaîne **factice** construite localement et n'affiche pas sa valeur. Il refuse de fonctionner hors de `secure`. Le deuxième passage retire le fichier de la version courante ; **le premier commit reste dans l'historique**. Cette démo montre le scan des fichiers du commit, **pas** une purge historique. Ne jamais utiliser une vraie clé pour cette démonstration. Ne pas lancer le script sur `vulnerable` : ses défauts permanents bloqueraient déjà la pipeline et fausseraient la comparaison.

## Si un véritable secret fuit (procédure, jamais avec des données réelles ici)

1. **Révoquer** l'ancien accès auprès du fournisseur et créer un remplacement hors du dépôt ; configurer la nouvelle valeur dans les variables protégées/masquées GitLab. **Ne pas attendre le nettoyage Git** pour révoquer.
2. Redéployer si nécessaire, vérifier que le service fonctionne avec la nouvelle valeur et que l'ancienne est inutilisable.
3. Retirer la valeur des fichiers courants. Après coordination avec les autres contributeurs, purger les copies dans l'historique et les forks avec un outil adapté (ex. `git filter-repo`), puis republier l'historique et faire re-cloner les copies concernées. Le nettoyage d'historique réécrit les commits : **ne pas le lancer automatiquement dans la CI**.
4. Vérifier journaux, artefacts, sauvegardes et registres ; noter l'incident. La rotation est indispensable même si l'historique est nettoyé.

## Limites

Un scan vert ne garantit pas l'absence de faille : règles Semgrep volontairement étroites, scores CVSS à interpréter, faux positifs/faux négatifs, image de base qui évolue, absence de scan historique dans le job, API protégées non couvertes par ce test statique. `npm test` simule PostgreSQL ; une exécution intégrée et ZAP restent nécessaires. L'accès réseau de Trivy à sa base d'avis peut manquer : **ne pas supprimer `--exit-code 1` pour contourner un problème de réseau**. Le Runner local peut ne plus avoir de place disque après plusieurs builds : surveiller `df -h` et nettoyer uniquement les images inutilisées après avoir sauvegardé les preuves.
