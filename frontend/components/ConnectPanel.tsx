"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useMemo } from "react";

const NETWORK_LABELS: Record<number, string> = {
  11155111: "Sepolia",
  1: "Ethereum Mainnet",
  137: "Polygon",
};

export function ConnectPanel() {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();

  const networkName = useMemo(() => {
    if (!chainId) return "Unknown";
    return NETWORK_LABELS[chainId] ?? `Chain ${chainId}`;
  }, [chainId]);

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-cyan-500/10">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-200">Wallet</span>
        <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
      </div>
      {status === "connected" && (
        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-300">
              {networkName}
            </span>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-slate-200">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
          </div>
          <p className="text-slate-400">
            Switch networks directly from Rainbow if you need to present on another chain.
          </p>
        </div>
      )}
      {status === "connected" && chains.length > 1 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => switchChain({ chainId: chain.id })}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
            >
              {chain.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

