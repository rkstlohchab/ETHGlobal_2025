# RWA Token Demo 🏠

A decentralized application (dApp) demonstrating Real World Asset (RWA) tokenization using smart contracts and a modern web interface. The project includes a whitelisting system, token minting capabilities, and real-time price feeds using Pyth Network.

## Features 🌟

- ERC20 token representing tokenized real estate shares
- Whitelist system for KYC compliance
- Admin-controlled minting process
- Real-time price feeds using Pyth Network
- Modern React frontend with Web3 integration
- Responsive and user-friendly interface

## Project Structure 📁

```
ETHGlobal/
├── contracts/           # Smart contract files
│   ├── contracts/      # Solidity contracts
│   ├── scripts/        # Deployment scripts
│   └── test/          # Contract tests
└── frontend/           # Next.js frontend application
    ├── app/           # Next.js app directory
    └── components/    # React components
```

## Prerequisites 📋

- Node.js (v18 or later)
- Git
- MetaMask or another Web3 wallet
- Yarn or npm

## Setup Instructions 🚀

### Smart Contracts Setup

1. Navigate to the contracts directory:
   ```bash
   cd contracts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the contracts directory:
   ```env
   ALCHEMY_SEPOLIA_URL="your_alchemy_sepolia_url"
   PRIVATE_KEY="your_wallet_private_key"
   ```

4. Compile the contracts:
   ```bash
   npx hardhat compile
   ```

5. Run local node (for development):
   ```bash
   npx hardhat node
   ```

6. Deploy contracts:
   - For local development:
     ```bash
     npx hardhat run scripts/deploy-local.js --network localhost
     ```
   - For Sepolia testnet:
     ```bash
     npx hardhat run scripts/deploy-local.js --network sepolia
     ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_TOKEN_ADDRESS="your_deployed_token_contract_address"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide 📖

1. **Connect Wallet**
   - Click the "Connect Wallet" button
   - Select your Web3 wallet (e.g., MetaMask)
   - Make sure you're on the correct network (localhost or Sepolia)

2. **Get Test ETH**
   - For local development: Use the default Hardhat accounts
   - For Sepolia: Use a faucet to get test ETH
     - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
     - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

3. **Interact with the dApp**
   - Click "Add me to whitelist & mint 1 token" to get whitelisted and receive tokens
   - View your token balance and the current oracle price
   - Monitor transaction status in your wallet

## Smart Contract Details 📝

The main contract `PropertyTokenLocal.sol` includes:
- ERC20 token implementation
- Whitelist functionality
- Admin-controlled minting
- Price feed integration with Pyth Network
- Transfer restrictions based on whitelist status

## Development 🛠

### Running Tests
```bash
cd contracts
npx hardhat test
```

### Local Development
1. Start local Hardhat node:
   ```bash
   cd contracts
   npx hardhat node
   ```

2. Deploy contracts locally:
   ```bash
   npx hardhat run scripts/deploy-local.js --network localhost
   ```

3. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Troubleshooting 🔧

1. **Insufficient Funds Error**
   - Ensure your wallet has enough ETH for gas fees
   - For local network: Import a Hardhat test account
   - For Sepolia: Get ETH from a faucet

2. **Transaction Failures**
   - Check if you're whitelisted
   - Verify you're on the correct network
   - Ensure contract address in frontend matches deployed contract

3. **Frontend Not Loading**
   - Verify environment variables are set correctly
   - Check if the contract is deployed to the correct network
   - Ensure your wallet is connected to the right network

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.
