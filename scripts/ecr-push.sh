#!/usr/bin/env bash
# Publication de l'image vers ECR depuis le poste de travail.
# Le lab AWS interdit l'écriture IAM (aucun rôle OIDC possible pour GitHub Actions) :
# la pipeline GitHub valide l'image, ce script la publie uniquement si elle est verte.
# Prérequis : lab démarré (identifiants AWS à jour), commit sur main, pipeline verte.
set -euo pipefail

REPO_NAME=${REPO_NAME:-fleetbook}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-997841588571}
GITHUB_REPO=${GITHUB_REPO:-00hbc000/FleetBook}

BRANCHE=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCHE" != "main" ]; then
  echo "Refus : publier uniquement depuis la branche main (actuelle : $BRANCHE)."
  exit 1
fi

SHA_COMPLET=$(git rev-parse HEAD)
STATUT=$(gh api "repos/${GITHUB_REPO}/actions/runs?head_sha=${SHA_COMPLET}" --jq '.workflow_runs[0].conclusion' 2>/dev/null || true)
if [ "$STATUT" != "success" ]; then
  echo "Refus : la pipeline GitHub de ce commit n'est pas verte (statut : ${STATUT:-inconnu})."
  exit 1
fi

REGISTRE="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE="${REGISTRE}/${REPO_NAME}:sha-$(git rev-parse --short HEAD)"

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRE"
docker build --target runner --tag "$IMAGE" .
docker push "$IMAGE"
echo "Image publiée : $IMAGE"
