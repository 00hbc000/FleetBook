# Politique de blocage CI — FleetBook Next.js

**VM d'exercice uniquement.** Runner shell local, un seul job concurrent. Les résultats sont conservés 7 jours dans des artefacts JSON sans afficher de secret.

| Contrôle | Échec obligatoire | Raison |
|---|---|---|
| Semgrep | Alerte ERROR ou erreur d'analyse (`--strict`) | Ne pas ignorer l'injection SQL, le HTML brut ou le rôle admin attribué par inscription. |
| Gitleaks | Toute chaîne détectée, rapport masqué | Une fuite doit arrêter la livraison ; ne pas afficher la valeur. |
| Trivy fs / image | Toute faille CRITICAL | Arrêter avant le push d'une image à risque critique. |
| Build / tests | Toute commande non nulle | Ne pas promouvoir un build qui ne compile pas. |

Les jobs secrets et dépendances s'exécutent même si un scan précédent a échoué, pour produire des preuves ; **image_build et push ne contournent pas ces échecs**. Le scan Gitleaks couvre les fichiers du commit, pas l'historique Git. L'ancien fichier CI du Drive employait `|| true` dans les tests et ZAP : ces contournements sont supprimés. Le déploiement et ZAP attendent un cluster local et des scripts/manifests **validés**, non ceux du Drive tels quels. Aucun résultat vert n'est affirmé sans exécution GitLab réelle.

En cas de vraie fuite : révoquer et remplacer d'abord, vérifier que l'ancienne valeur est inutilisable, retirer la valeur des fichiers, puis coordonner un nettoyage de l'historique et des forks. Ne jamais mettre un vrai secret dans ce TP. Une pipeline verte ne remplace ni revue humaine ni tests d'intégration ; les résultats des outils doivent être interprétés dans leur contexte.
