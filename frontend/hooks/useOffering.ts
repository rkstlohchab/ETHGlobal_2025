"use client";

import { useReadContract, useAccount, useWriteContract } from "wagmi";
import { useCallback } from "react";
import { propertyOfferingAbi, erc20Abi } from "@/lib/abi";
const WEI_DECIMALS = BigInt("1000000000000000000");

export function useOffering(offeringAddress?: `0x${string}`, tokenAddress?: `0x${string}`) {
  const { address } = useAccount();

  const { data: pricePerToken } = useReadContract({
    address: offeringAddress,
    abi: propertyOfferingAbi,
    functionName: "pricePerToken",
    query: { enabled: Boolean(offeringAddress) },
  });

  const { data: totalRaised } = useReadContract({
    address: offeringAddress,
    abi: propertyOfferingAbi,
    functionName: "totalRaised",
    query: { enabled: Boolean(offeringAddress) },
  });

  const { data: availableSupply } = useReadContract({
    address: offeringAddress,
    abi: propertyOfferingAbi,
    functionName: "availableSupply",
    query: { enabled: Boolean(offeringAddress) },
  });

  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && offeringAddress ? [address, offeringAddress] : undefined,
    query: { enabled: Boolean(address && offeringAddress && tokenAddress) },
  });

  const { writeContractAsync } = useWriteContract();

  const buy = useCallback(
    async (tokenAmount: bigint) => {
      if (!offeringAddress || !pricePerToken) return;
      const cost = (tokenAmount * BigInt(pricePerToken.toString())) / WEI_DECIMALS;
      await writeContractAsync({
        address: offeringAddress,
        abi: propertyOfferingAbi,
        functionName: "buy",
        args: [tokenAmount],
        value: cost,
      });
    },
    [offeringAddress, pricePerToken, writeContractAsync]
  );

  const sell = useCallback(
    async (tokenAmount: bigint) => {
      if (!offeringAddress) return;
      await writeContractAsync({
        address: offeringAddress,
        abi: propertyOfferingAbi,
        functionName: "sell",
        args: [tokenAmount],
      });
    },
    [offeringAddress, writeContractAsync]
  );

  const approve = useCallback(
    async (amount: bigint) => {
      if (!tokenAddress || !offeringAddress) return;
      await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [offeringAddress, amount],
      });
    },
    [tokenAddress, offeringAddress, writeContractAsync]
  );

  return {
    pricePerToken,
    totalRaised,
    availableSupply,
    allowance,
    buy,
    sell,
    approve,
  } as const;
}

