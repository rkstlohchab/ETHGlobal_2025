"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
// import { localhost } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const { wallets } = getDefaultWallets({
  appName: "RWA Token Demo",
  projectId: "4bd2cf6cff63a8f25b77c2ef95f5c62e", // can be random for localhost
});

// const hardhatChain = {
//   id: 31337,
//   name: "Hardhat",
//   network: "hardhat",
//   nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
//   rpcUrls: {
//     default: { http: ["http://127.0.0.1:8545"] },
//     public: { http: ["http://127.0.0.1:8545"] },
//   },
//   testnet: true,
// };

const sepoliaChain = {
  id: 11155111,
  name: "Sepolia",
  network: "sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? ""] },
    public: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? ""] },
  },
  testnet: true,
};

const config = createConfig({
  chains: [sepoliaChain],
  transports: {
    [sepoliaChain.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? ""),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}