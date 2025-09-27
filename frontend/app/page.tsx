"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { useState, useEffect } from "react";

const TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;

const tokenAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getLatestPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { type: "int256" },
      { type: "uint64" },
    ],
  },
  {
    name: "addWhitelist",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "who", type: "address" }],
    outputs: [],
  },
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState("");
  const [mounted, setMounted] = useState(false);

  // Only show the UI after component is mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Read balance
  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
  });

  // Read oracle price
  const { data: priceData } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "getLatestPrice",
  });

  const { writeContractAsync } = useWriteContract();

  async function handleWhitelistAndMint() {
    if (!address) return;
    try {
      setStatus("Adding to whitelist...");
      await writeContractAsync({
        address: TOKEN_ADDRESS,
        abi: tokenAbi,
        functionName: "addWhitelist",
        args: [address],
      });

      setStatus("Minting...");
      await writeContractAsync({
        address: TOKEN_ADDRESS,
        abi: tokenAbi,
        functionName: "mint",
        args: [address, BigInt("1000000000000000000")], // 1 token
      });

      setStatus("✅ Minted 1 token!");
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setStatus("❌ Error: " + (error.message ?? error.toString()));
    }
  }

  // Don't render anything until mounted
  if (!mounted) return null;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏠 RWA Token Demo</h1>
      <ConnectButton />
      {isConnected && (
        <div className="mt-4">
          <p>Address: {address}</p>
          <p>Balance: {balance ? balance.toString() : "—"}</p>
          <p>
            Oracle Price:{" "}
            {priceData ? (priceData)[0].toString() : "—"}
          </p>

          <button
            onClick={handleWhitelistAndMint}
            className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
          >
            Add me to whitelist & mint 1 token
          </button>
          <div className="mt-2">{status}</div>
        </div>
      )}
    </main>
  );
}
