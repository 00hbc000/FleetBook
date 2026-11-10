#!/usr/bin/env bash
# Deploiement de FleetBook sur le cluster kind local.
# Etapes : verification de pipeline verte, secret, migration Drizzle, seed,
# application de l'image validee depuis GHCR, controle de sante.
set -euo pipefail

GITHUB_REPO=${GITHUB_REPO:-00hbc000/FleetBook}
NAMESPACE=${NAMESPACE:-fleetbook}
CLUSTER=${CLUSTER:-fleetbook}

BRANCHE=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCHE" != "main" ]; then
  echo "Refus : deployer uniquement depuis la branche main (actuelle : $BRANCHE)."
  exit 1
fi

SHA_COMPLET=$(git rev-parse HEAD)
STATUT=$(gh api "repos/${GITHUB_REPO}/actions/runs?head_sha=${SHA_COMPLET}" --jq '.workflow_runs[0].conclusion' 2>/dev/null || true)
if [ "$STATUT" != "success" ]; then
  echo "Refus : la pipeline GitHub de ce commit n'est pas verte (statut : ${STATUT:-inconnu})."
  exit 1
fi

IMAGE="ghcr.io/00hbc000/fleetbook:${SHA_COMPLET}"

kubectl apply -f k8s/00-namespace.yaml

if ! kubectl get secret fleetbook-secrets -n "$NAMESPACE" >/dev/null 2>&1; then
  DB_PASSWORD=$(openssl rand -hex 16)
  kubectl create secret generic fleetbook-secrets -n "$NAMESPACE" \
    --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
    --from-literal=JWT_SECRET="$(openssl rand -hex 32)" \
    --from-literal=DATABASE_URL="postgresql://fleetbook:${DB_PASSWORD}@postgres:5432/fleetbook_next"
  echo "Secret fleetbook-secrets cree."
fi

docker build --target tooling -t fleetbook-tooling:local .
kind load docker-image fleetbook-tooling:local --name "$CLUSTER"

kubectl apply -f k8s/10-postgres.yaml
kubectl -n "$NAMESPACE" rollout status deployment/postgres --timeout=180s

kubectl -n "$NAMESPACE" delete job drizzle-migrate --ignore-not-found
kubectl apply -f k8s/15-migrate-job.yaml
kubectl -n "$NAMESPACE" wait --for=condition=complete job/drizzle-migrate --timeout=180s

kubectl -n "$NAMESPACE" exec -i deploy/postgres -- \
  sh -c 'psql -U fleetbook -d fleetbook_next' < scripts/seed.sql

sed "s|ghcr.io/00hbc000/fleetbook:placeholder|${IMAGE}|" k8s/20-app.yaml | kubectl apply -f -
kubectl apply -f k8s/30-networkpolicies.yaml
kubectl -n "$NAMESPACE" rollout status deployment/app --timeout=300s

sleep 3
curl -fsS http://127.0.0.1:8081/api/health && echo
echo "Application disponible : http://127.0.0.1:8081"
