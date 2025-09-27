# Real-World Asset Tokenization Stack

Full-stack reference implementation for tokenized real-estate offerings using the ERC-3643 standard, Pyth price feeds, and a Next.js front-end with mocked compliance. The repo contains both the on-chain contracts (`contracts/`) and the web client (`frontend/`).

## Repository Layout

```
ETHGlobal/
├── contracts/           Hardhat workspace for Solidity contracts
│   ├── contracts/       ERC-3643 suite, oracle consumer, property offering
│   ├── scripts/         Deployment + provisioning scripts
│   ├── test/            Jest-style Hardhat tests
│   └── .env             Chain RPC, keys, deployed addresses
└── frontend/            Next.js 15 + Wagmi + RainbowKit client
    ├── app/             App Router pages/layouts
    ├── components/      UI, modals, mocked compliance flow
    ├── hooks/           Pyth price + offering helpers
    └── .env.local       Front-end runtime config
```

## 1. Prerequisites

- Node.js ≥ 18 (Node 20 recommended)
- npm ≥ 9 (or pnpm 8 / yarn 1, adjust commands accordingly)
- Git
- MetaMask (or any EVM wallet) with Sepolia test ETH

## 2. Contracts Workspace

### Install

```bash
cd /Users/raksithlochabb/Documents/GitHub/ETHGlobal/contracts
npm install
```

### Environment (`contracts/.env`)

```
# RPC + deployer
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>
PRIVATE_KEY=0x...               # deployer wallet (no 0x removal)

# Pyth Network
PYTH_CONTRACT_ADDRESS=0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
PRICE_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace

# Previously deployed ERC-3643 core (if reusing existing stack)
CLAIM_TOPICS_REGISTRY_ADDRESS=0xe789d599D5A63cACAEC27992b2bc82Ea214c6043
CLAIM_ISSUERS_REGISTRY_ADDRESS=0x5C49ecE4A20AdE0d81EB2089c9df809569F9F136
IDENTITY_REGISTRY_STORAGE_ADDRESS=0xb1885352232C9acCD8b8637a6d1B5C390eD9718c
IDENTITY_REGISTRY_ADDRESS=0x87875DC8203918e47d5a3FBDB381a08a73F4dB0f
COMPLIANCE_ADDRESS=0x099cE2D1C6219f9759ee4599F046A9E074fb9d5F
TOKEN_ADDRESS=0x2EdeA8e8B7bC572436020CD8403dfbEf39570000

# Deployments produced by scripts (fill after each run)
PYTH_CONSUMER_ADDRESS=
RWA_ORACLE_ADAPTER_ADDRESS=
NEXT_PUBLIC_SKYLINE_OFFERING=0x32dD2216Cb3FAfe41160bdb6108B646351590D2A
NEXT_PUBLIC_HARBOR_OFFERING=0x3C8cDFa48E2289F9393Ee1e1b3C374Ec8Fc298A3

# Optional demo helpers
PROPERTY_TOKEN_ADDRESS=0x2EdeA8e8B7bC572436020CD8403dfbEf39570000
PROPERTY_PRICE_PER_TOKEN_WEI=100000000000000   # 0.0001 ETH
PROPERTY_TARGET_RAISE_WEI=1000000000000000000  # 1 ETH
```

### Compile & Test

```bash
npx hardhat compile
npx hardhat test
```

### Deploy Flow (Sepolia)

```bash
# 1. Core ERC-3643 stack (optional if already deployed)
npx hardhat run scripts/deploy-erc3643-sepolia.js --network sepolia

# 2. Pyth consumer + adapter (needs PYTH_CONTRACT_ADDRESS + PRICE_ID)
npx hardhat run scripts/deploy-pyth-consumer.js --network sepolia

# 3. Property offering contracts for each asset
npx hardhat run scripts/deploy-property-offering.js --network sepolia

# 4. Provision offerings (identity, inventory, pricing, liquidity)
npx hardhat run scripts/setup-offering.js --network sepolia
```

> `setup-offering.js` expects the deployer to be owner of the ERC-3643 token and registries. Adjust or grant roles manually if ownership differs.

### Manual Provisioning Reference

If you prefer Hardhat console (or need to tweak amounts):

```bash
npx hardhat console --network sepolia
```

```js
const tokenAddr = "0x2EdeA8e8B7bC572436020CD8403dfbEf39570000";
const identityRegistryAddr = "0x87875DC8203918e47d5a3FBDB381a08a73F4dB0f";
const skylineOffering = "0x32dD2216Cb3FAfe41160bdb6108B646351590D2A";
const harborOffering  = "0x3C8cDFa48E2289F9393Ee1e1b3C374Ec8Fc298A3";
const [admin] = await ethers.getSigners();

// Grant yourself permissions (if you own the contracts)
const registry = await ethers.getContractAt("IdentityRegistry", identityRegistryAddr);
await registry.grantRole(await registry.AGENT_ROLE(), admin.address);
const token = await ethers.getContractAt("Token", tokenAddr);
await token.grantRole(await token.AGENT_ROLE(), admin.address);

// Register offerings as verified identities (country 356 = India)
await registry.registerIdentity(skylineOffering, skylineOffering, 356);
await registry.registerIdentity(harborOffering, harborOffering, 356);

// Seed token inventory & price
await token.mint(skylineOffering, ethers.parseUnits("10000", 18));
await token.mint(harborOffering,  ethers.parseUnits("10000", 18));
const skyline = await ethers.getContractAt("PropertyOffering", skylineOffering);
const harbor  = await ethers.getContractAt("PropertyOffering", harborOffering);
await skyline.updatePrice(ethers.parseEther("0.0001"));
await harbor.updatePrice(ethers.parseEther("0.0001"));

// Optional liquidity for buybacks
await admin.sendTransaction({ to: skylineOffering, value: ethers.parseEther("0.1") });
await admin.sendTransaction({ to: harborOffering,  value: ethers.parseEther("0.1") });
```

To confirm state:

```bash
npx hardhat run scripts/check-offering.js --network sepolia
```

## 3. Front-End Workspace

### Install

```bash
cd /Users/raksithlochabb/Documents/GitHub/ETHGlobal/frontend
npm install
```

### Environment (`frontend/.env.local`)

```
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>
NEXT_PUBLIC_TOKEN_ADDRESS=0x2EdeA8e8B7bC572436020CD8403dfbEf39570000
NEXT_PUBLIC_PYTH_ADAPTER_ADDRESS=<RWAOracleAdapter from deploy>
NEXT_PUBLIC_SKYLINE_OFFERING=0x32dD2216Cb3FAfe41160bdb6108B646351590D2A
NEXT_PUBLIC_HARBOR_OFFERING=0x3C8cDFa48E2289F9393Ee1e1b3C374Ec8Fc298A3
```

Restart the dev server any time you edit `.env.local`.

### Run Locally

```bash
npm run dev
# http://localhost:3000
```

### Lint & Type-Check

```bash
npm run lint
npm run typecheck   # add if using tsc --noEmit
```

## 4. Front-End Usage Walkthrough

1. **Connect Wallet** – RainbowKit modal; ensure MetaMask is on Sepolia.
2. **Mock Compliance** – The UI displays a checklist (identity registration, approvals). Real checks are mocked but the instructions reflect on-chain requirements.
3. **Asset Grid** – Each property card shows price, progress, and remaining inventory.
4. **Buy Tokens** – Open the modal, choose “Buy full allocation” or a custom token amount. MetaMask displays the cost (0.0001 ETH per token). Post-setup, the buy transaction succeeds and transfers ERC-3643 tokens from the offering inventory to the wallet.
5. **Sell Tokens** (coming soon) – Contract supports `sell()` once wallet approves the offering to spend its tokens and the contract holds sufficient ETH liquidity.

## 5. Reproducing the Demo

1. **Clone** and complete both `contracts/.env` and `frontend/.env.local` with your keys.
2. **Install** packages in `contracts/` and `frontend/`.
3. **Compile** contracts (`npx hardhat compile`).
4. **Deploy** (if starting fresh):
   - `deploy-erc3643-sepolia.js`
   - `deploy-pyth-consumer.js`
   - `deploy-property-offering.js`
5. **Provision** offerings via `setup-offering.js` or manually using the console walkthrough above.
6. **Run** the Next.js app and connect MetaMask on Sepolia.
7. **Use** the Buy modal; after confirming with MetaMask, tokens move from the offering treasury into your wallet.

## 6. Master Bootstrap Script (optional)

Create `bootstrap.sh` in repo root to automate install + compile + deploy:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)

echo "===> Installing contract deps"
cd "$ROOT_DIR/contracts"
npm install
npx hardhat compile

echo "===> Deploying (assumes .env is populated)"
npx hardhat run scripts/deploy-erc3643-sepolia.js --network sepolia || true
npx hardhat run scripts/deploy-pyth-consumer.js --network sepolia
npx hardhat run scripts/deploy-property-offering.js --network sepolia
npx hardhat run scripts/setup-offering.js --network sepolia

echo "===> Installing frontend deps"
cd "$ROOT_DIR/frontend"
npm install
npm run lint

echo "===> Done. Start the UI with: npm run dev"
```

Make it executable on macOS/Linux:

```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

> Adjust deploy calls if some pieces are already on-chain. Use `|| true` to ignore expected failures (e.g., re-deploying ERC-3643).

## 7. Production Deployment

### Front-End

- **Vercel** is the easiest target. Create a project pointing to `frontend/`.
- Add environment variables in the Vercel dashboard (`NEXT_PUBLIC_*`, RPC URL, adapter/offering addresses).
- On each redeploy, update these envs if contract addresses change.

### Contracts

- Contracts are already live on Sepolia. For production (e.g., mainnet or another chain), redeploy through Hardhat with the same scripts.
- Store the resulting addresses securely. Consider using a secrets manager or a pinned JSON file that your app can load.
- Never expose `PRIVATE_KEY` to Vercel. Contract deployment should happen locally or via a secure CI job with restricted secrets.

### Updating Front-End After Contract Redeploys

1. Redeploy via Hardhat, note new addresses.
2. Update `contracts/.env` (for reference) and `frontend/.env.local` / Vercel envs.
3. Redeploy the Next.js app (Vercel redeploy) so clients use the new contract endpoints.

## 8. Operations Tips

- **Identity Registry**: Any address interacting with ERC-3643 token must be registered. For hackathon demos, we register offering contracts only; user wallets are bypassed by mocked compliance in the UI.
- **Pyth Updates**: `PythPriceConsumer` supports `updatePriceFeeds`. Call it periodically (via script or backend service) to push fresh price data. The UI currently displays cached values.
- **Security**: Do not use test deployer keys in production. Integrate with a secure signer (e.g., Safe, managed wallet) before going live with real assets.

## 9. Troubleshooting

- **Buy button fails silently**: Offering lacks token inventory, isn’t registered, or price remains the default 0.1 ETH. Run `setup-offering.js`.
- **MetaMask shows `execution reverted: ERC-3643: Unverified identity`**: Register wallet/offering in the identity registry before minting or transferring.
- **Frontend RPC errors (`127.0.0.1:8545 refused`)**: Set `NEXT_PUBLIC_SEPOLIA_RPC_URL` to a public endpoint (Alchemy/Infura) and restart `npm run dev`.
- **Next.js image error**: Ensure allowed domains in `frontend/next.config.ts` match the mock asset URLs (already configured for Unsplash).

---

Happy hacking! Update this README with any new scripts or deployment steps you add during development.
