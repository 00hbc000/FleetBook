# Politique de blocage CI — FleetBook Next.js

**VM d'exercice uniquement pour l'application.** GitLab.com bloque la création de jobs pour le compte de formation tant que sa vérification d'identité n'est pas terminée. Sans carte, le contrôle CI est donc aussi défini dans `.github/workflows/security.yml` sur des machines temporaires GitHub, sans accès à la VM. Le Runner shell GitLab local reste installé mais aucun résultat GitLab n'est revendiqué. Les résultats GitHub sont conservés 7 jours dans des artefacts JSON sans afficher de secret. Le dépôt GitHub est public : ne jamais y attacher un Runner auto-hébergé sur la VM (risque d'exécuter du code non fiable).

| Contrôle | Échec obligatoire | Raison |
|---|---|---|
| Semgrep | Alerte ERROR ou erreur d'analyse (`--strict`) | Ne pas ignorer l'injection SQL, le HTML brut ou le rôle admin attribué par inscription. |
| Gitleaks | Toute chaîne détectée, rapport masqué | Une fuite doit arrêter la livraison ; ne pas afficher la valeur. |
| Trivy fs / image | Toute faille CRITICAL | Arrêter avant le push d'une image à risque critique. |
| Build / tests | Toute commande non nulle | Ne pas promouvoir un build qui ne compile pas. |

Les jobs GitHub `sast`, `secrets` et `dependencies` sont indépendants : chacun produit son rapport même si un autre échoue ; **le job `image` et son push ne s'exécutent que si tous les contrôles passent**. Le scan Gitleaks couvre les fichiers du commit, pas l'historique Git. L'ancien fichier CI du Drive employait `|| true` dans les tests et ZAP : ces contournements sont supprimés. Le déploiement et ZAP attendent un cluster local et des scripts/manifests **validés**, non ceux du Drive tels quels. La preuve réelle GitHub est le [run 42415073581](https://github.com/00hbc000/FleetBook/actions/runs/42415073581) : build/tests et Trivy fs CRITICAL verts ; étapes de détection Gitleaks et Semgrep rouges ; image et push ignorés. Ce résultat ne prouve ni le scan d'image, ni un déploiement kind, ni une exécution GitLab.

En cas de vraie fuite : révoquer et remplacer d'abord, vérifier que l'ancienne valeur est inutilisable, retirer la valeur des fichiers, puis coordonner un nettoyage de l'historique et des forks. Ne jamais mettre un vrai secret dans ce TP. Une pipeline verte ne remplace ni revue humaine ni tests d'intégration ; les résultats des outils doivent être interprétés dans leur contexte.

## Mise à jour — branche secure (novembre 2026)

Les sept défauts pédagogiques sont corrigés sur la branche `secure` (détail dans `docs/vulnerabilites.md`, section « Après »). Le job `image` construit et scanne l'image **sans la publier** : la publication passera par ECR (AWS) dans une étape ultérieure. Preuve : run 42727865370 entièrement vert. Le fichier `.gitlab-ci.yml` et les manifestes K8s hérités du Drive sont supprimés : GitLab est abandonné, et les manifestes seront réécrits pour EKS avec l'architecture à service unique.
