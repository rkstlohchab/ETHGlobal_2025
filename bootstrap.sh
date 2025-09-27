#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
ACTION="${1:-}"

if [[ "$ACTION" == "-h" || "$ACTION" == "--help" ]]; then
  cat <<'EOHELP'
Usage: ./bootstrap.sh [--deploy]

Default runs installs, compile, and health checks using existing contract addresses.
Pass --deploy to force fresh deployments and provisioning on Sepolia.
EOHELP
  exit 0
fi

DEPLOY=false
if [[ "$ACTION" == "--deploy" || "$ACTION" == "deploy" ]]; then
  DEPLOY=true
fi

echo "===> Installing contract dependencies"
cd "$ROOT_DIR/contracts"
npm install

echo "===> Compiling contracts"
npx hardhat compile

if [[ "$DEPLOY" == true ]]; then
  echo "===> Deploying contracts (Sepolia)"
  echo "      - Ensure contracts/.env is populated before running"
  npx hardhat run scripts/deploy-erc3643-sepolia.js --network sepolia || true
  npx hardhat run scripts/deploy-pyth-consumer.js --network sepolia
  npx hardhat run scripts/deploy-property-offering.js --network sepolia
  npx hardhat run scripts/setup-offering.js --network sepolia
else
  echo "===> Skipping deployments (using addresses already in contracts/.env)"
  npx hardhat run scripts/check-offering.js --network sepolia || true
fi

echo "===> Installing frontend dependencies"
cd "$ROOT_DIR/frontend"
npm install

echo "===> Running frontend lint"
npm run lint || true

cat <<'EONOTE'

All steps finished.

Next actions:
  1. Update frontend/.env.local with the latest contract addresses.
  2. Start the dev server with: npm run dev

EONOTE

