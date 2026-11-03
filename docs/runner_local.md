# Runner GitLab local — Ubuntu VM (terminal uniquement)

Pré-requis : projet **GitLab** déjà créé et branche poussée dans ce projet, compte GitLab autorisé à créer un Runner de projet, accès Internet depuis la VM. Le dépôt GitHub seul **n'exécute pas** `.gitlab-ci.yml`. Runner **shell** dédié à cette VM : un job peut utiliser Docker, puis kubectl sur le kind local (Block 3). Ne jamais enregistrer ce Runner pour des dépôts inconnus. Le groupe Docker équivaut pratiquement à root ; VM d'exercice isolée uniquement. Un seul job concurrent réduit l'usage RAM et garantit que le scan retrouve les images du build sur le même démon.

## 1. Installer le service Runner

```bash
sudo apt update
sudo apt install -y curl ca-certificates python3-venv tar
curl -fsSL -o /tmp/install-gitlab-runner.sh https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh
# Examiner le script récupéré avant de l'exécuter sur votre VM.
less /tmp/install-gitlab-runner.sh
sudo bash /tmp/install-gitlab-runner.sh
sudo apt install -y gitlab-runner
sudo usermod -aG docker gitlab-runner
sudo systemctl enable --now gitlab-runner
```

Si le dépôt de paquets ne prend pas encore en charge Ubuntu 26.04, **arrêter ici** et lire l'erreur plutôt que lancer un installateur inconnu. GitLab propose aussi des binaires officiels sur sa documentation. `less` est une lecture **dans le terminal**. La VM peut ralentir pendant l'installation.

## 2. Créer et enregistrer le Runner par API (aucun jeton dans le dépôt)

Préparer le nom réel de votre serveur et le chemin réel du projet dans GitLab, sans les coller dans le dépôt. Obtenir un jeton d'accès GitLab avec portée `api` **sur votre machine**, ne jamais le communiquer dans un chat ou un log. Les commandes `read -s` ci-dessous ne l'affichent pas et ne l'ajoutent pas à l'historique du shell.

```bash
read -r -p 'URL GitLab (ex. https://votre-gitlab) : ' GITLAB_URL
read -r -p 'Chemin du projet GitLab (groupe/FleetBook) : ' PROJECT_PATH
read -rs -p 'Jeton API GitLab (saisie cachée) : ' API_TOKEN; echo
encoded=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$PROJECT_PATH")
project_id=$(curl -fsS -H "PRIVATE-TOKEN: $API_TOKEN" "$GITLAB_URL/api/v4/projects/$encoded" | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
runner_token=$(curl -fsS -X POST -H "PRIVATE-TOKEN: $API_TOKEN" --data-urlencode 'runner_type=project_type' --data-urlencode "project_id=$project_id" --data-urlencode 'description=FleetBook VM locale' --data-urlencode 'tag_list[]=fleetbook-local' --data-urlencode 'run_untagged=false' "$GITLAB_URL/api/v4/user/runners" | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')
unset API_TOKEN
sudo gitlab-runner register --non-interactive --url "$GITLAB_URL" --token "$runner_token" --executor shell --description 'FleetBook VM locale'
unset runner_token
sudo systemctl restart gitlab-runner
sudo gitlab-runner verify
sudo -u gitlab-runner docker info >/dev/null && echo 'Docker accessible au Runner'
sudo grep '^concurrent =' /etc/gitlab-runner/config.toml
```

Si `concurrent` n'est pas `1`, modifier cette valeur dans `/etc/gitlab-runner/config.toml` avec un éditeur **terminal**, puis `sudo systemctl restart gitlab-runner`. Le jeton Runner doit être traité comme un secret ; la commande `register` le transmet brièvement comme argument de processus sur la VM. Protéger la VM et ne pas enregistrer une sortie de débogage de cette commande. Les tags sont fixés lors de la création par API ; tous les jobs requièrent `fleetbook-local`. Pour les variables GitLab **protégées**, protéger aussi la branche `secure` dans GitLab avant le Block 3 ; ne pas essayer de contourner les protections avec une variable en clair.

## 3. Installer les outils CLI sur la VM Runner

Node.js 20+ et Docker sont déjà nécessaires à FleetBook. Semgrep s'installe dans un environnement Python séparé (installation potentiellement lourde en RAM) :

```bash
sudo python3 -m venv /opt/fleetbook-semgrep
sudo /opt/fleetbook-semgrep/bin/pip install 'semgrep==1.183.0'
sudo ln -sf /opt/fleetbook-semgrep/bin/semgrep /usr/local/bin/semgrep
```

Binaires Gitleaks et Trivy officiels, versionnés et vérifiés par SHA-256 publié avec chaque version :

```bash
curl -fsSL -o /tmp/gitleaks_8.24.3_linux_x64.tar.gz https://github.com/gitleaks/gitleaks/releases/download/v8.24.3/gitleaks_8.24.3_linux_x64.tar.gz
curl -fsSL -o /tmp/gitleaks_8.24.3_checksums.txt https://github.com/gitleaks/gitleaks/releases/download/v8.24.3/gitleaks_8.24.3_checksums.txt
(cd /tmp && grep 'gitleaks_8.24.3_linux_x64.tar.gz$' gitleaks_8.24.3_checksums.txt | sha256sum -c -)
sudo tar -xzf /tmp/gitleaks_8.24.3_linux_x64.tar.gz -C /usr/local/bin gitleaks
curl -fsSL -o /tmp/trivy_0.76.1_Linux-64bit.tar.gz https://github.com/aquasecurity/trivy/releases/download/v0.76.1/trivy_0.76.1_Linux-64bit.tar.gz
curl -fsSL -o /tmp/trivy_0.76.1_checksums.txt https://github.com/aquasecurity/trivy/releases/download/v0.76.1/trivy_0.76.1_checksums.txt
(cd /tmp && grep 'trivy_0.76.1_Linux-64bit.tar.gz$' trivy_0.76.1_checksums.txt | sha256sum -c -)
sudo tar -xzf /tmp/trivy_0.76.1_Linux-64bit.tar.gz -C /usr/local/bin trivy
node --version; docker --version; semgrep --version; gitleaks version; trivy --version
```

Ces téléchargements peuvent échouer si Internet manque, et Semgrep/Trivy peuvent consommer beaucoup de RAM ou d'espace disque. Faire les installations **une par une** ; vérifier `free -h` et `df -h` avant de lancer les scans. Ne pas lancer kind, ZAP et Trivy simultanément sur une petite VM. `kubectl`, le cluster kind et les fichiers `k8s/` arrivent au Block 3 : les jobs de déploiement sont ignorés jusque-là.

## Preuves à conserver

Sorties terminal de `gitlab-runner verify`, de `sudo -u gitlab-runner docker info` (sans identifiant), versions des outils, premier job `sast` et premier job `secrets` en échec attendu sur `vulnerable`, artefacts JSON **masqués** sans affichage des valeurs. Ne pas capturer de jeton/API token dans une image.
