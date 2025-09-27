"use client";

import { useAccount, useReadContract } from "wagmi";
import { useMemo } from "react";

const ADAPTER_ADDRESS = process.env.NEXT_PUBLIC_ADAPTER_ADDRESS as `0x${string}` | undefined;
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}` | undefined;

const adapterAbi = [
  {
    inputs: [],
    name: "latestQuote",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint8", name: "decimals", type: "uint8" },
          { internalType: "uint64", name: "publishTime", type: "uint64" },
        ],
        internalType: "struct RWAOracleAdapter.PriceQuote",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const tokenAbi = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useTokenSnapshot() {
  const { address } = useAccount();

  const { data: balanceData, isLoading: balanceLoading } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && TOKEN_ADDRESS),
    },
  });

  const { data: quoteData, isLoading: quoteLoading } = useReadContract({
    address: ADAPTER_ADDRESS,
    abi: adapterAbi,
    functionName: "latestQuote",
    query: {
      enabled: Boolean(ADAPTER_ADDRESS),
    },
  });

  return useMemo(() => {
    const balance = balanceData ? BigInt(balanceData.toString()).toString() : undefined;

    if (!quoteData) {
      return {
        loading: balanceLoading || quoteLoading,
        balance,
        usdValue: undefined,
        price: undefined,
        publishTime: undefined,
      } as const;
    }

    const [quote] = quoteData as unknown as [{ price: bigint; decimals: number; publishTime: bigint }];

    const normalizedPrice = Number(quote.price) / 10 ** quote.decimals;
    const normalizedBalance = balanceData ? Number(balanceData) / 1e18 : 0; // assume 18 decimals for demo

    return {
      loading: balanceLoading || quoteLoading,
      balance,
      usdValue: normalizedBalance ? (normalizedBalance * normalizedPrice).toFixed(2) : undefined,
      price: normalizedPrice.toFixed(2),
      publishTime: new Date(Number(quote.publishTime) * 1000).toLocaleString(),
    } as const;
  }, [balanceLoading, quoteLoading, balanceData, quoteData]);
}

