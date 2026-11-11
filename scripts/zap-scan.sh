#!/usr/bin/env bash
# Scan DAST (OWASP ZAP baseline) contre l'application locale.
# Usage : ./scripts/zap-scan.sh [cible]
set -euo pipefail

TARGET="${1:-http://127.0.0.1:8081}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT/reports"
mkdir -p "$REPORT_DIR"

echo "Scan ZAP baseline : $TARGET"
docker run --rm --network host \
  -v "$REPORT_DIR:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "$TARGET" -J zap-report.json

echo "Rapport JSON : $REPORT_DIR/zap-report.json"
