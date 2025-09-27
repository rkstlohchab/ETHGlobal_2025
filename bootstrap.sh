#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)

echo "===> Installing contract dependencies"
cd "$ROOT_DIR/contracts"
npm install

echo "===> Compiling contracts"
npx hardhat compile

echo "===> Deploying contracts (Sepolia)"
echo "      - Ensure contracts/.env is populated before running"
npx hardhat run scripts/deploy-erc3643-sepolia.js --network sepolia || true
npx hardhat run scripts/deploy-pyth-consumer.js --network sepolia
npx hardhat run scripts/deploy-property-offering.js --network sepolia
npx hardhat run scripts/setup-offering.js --network sepolia

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

