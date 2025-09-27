# ERC-3643 RWA Contracts with Pyth Integration

This Hardhat workspace contains the ERC-3643 (T-REX) suite already wired for
real-world assets, plus a Pyth oracle integration that exposes ETH/USD pricing
on-chain and to the front-end.

## Overview

- `contracts/erc3643/*`: canonical ERC-3643 token, compliance, and registries
- `contracts/oracle/PythPriceConsumer.sol`: lightweight consumer wrapping the
  Pyth Network contract to fetch normalized prices and manage fees/refunds
- `contracts/oracle/RWAOracleAdapter.sol`: convenience adapter that shares the
  latest quote with the ERC-3643 token / dApp and converts token balances to
  USD
- `contracts/mocks/*.sol`: local testing doubles (`MockPyth`, `MockERC20`)
- `scripts/deploy-erc3643-sepolia.js`: existing deployment flow for the core
  registries + token
- `scripts/deploy-pyth-consumer.js`: new script to deploy the consumer and
  adapter using environment variables
- `test/*.js`: Hardhat test suite, including new coverage for the oracle

## Environment Variables

Create `contracts/.env` (already ignored) and configure:

```env
ALCHEMY_SEPOLIA_URL=...
PRIVATE_KEY=0x...
PYTH_CONTRACT_ADDRESS=0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
PRICE_ID=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
TOKEN_ADDRESS=<existing ERC-3643 token address>
```

`TOKEN_ADDRESS` is optional; when supplied the deploy script will also create an
`RWAOracleAdapter` bound to that token.

## Install & Compile

```bash
cd contracts
npm install
npx hardhat compile
```

## Run Tests

```bash
npx hardhat test
```

This covers:
- ERC-3643 `Lock` sample
- `PythPriceConsumer` behaviour (normalization, staleness guard, fee refund)
- `RWAOracleAdapter` quoting helpers

## Deploy to Sepolia

1. Ensure `.env` is populated as above
2. Deploy oracle components:

   ```bash
   npx hardhat run scripts/deploy-pyth-consumer.js --network sepolia
   ```

   This outputs the consumer (and adapter if `TOKEN_ADDRESS` set).

3. (Optional) Deploy the ERC-3643 stack if you have not already:

   ```bash
   npx hardhat run scripts/deploy-erc3643-sepolia.js --network sepolia
   ```

## Frontend Consumption

The Next.js app reads `NEXT_PUBLIC_TOKEN_ADDRESS` and calls:

- `latestQuote()` on `RWAOracleAdapter` for price/publish time metadata
- `quoteValue(amount)` to convert token balances into USD (18 decimals)

Make sure the deployed adapter address is injected into the front-end env file.


