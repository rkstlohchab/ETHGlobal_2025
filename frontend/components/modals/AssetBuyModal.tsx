"use client";

import { MockAsset } from "@/data/mockAssets";
import { useOffering } from "@/hooks/useOffering";
import { useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";

type Props = {
  asset: MockAsset;
  open: boolean;
  onClose: () => void;
};

export function AssetBuyModal({ asset, open, onClose }: Props) {
  const [tokens, setTokens] = useState("1");
  const { pricePerToken, availableSupply, buy } = useOffering(
    asset.offeringAddress,
    asset.tokenAddress
  );

  const cost = useMemo(() => {
    if (!pricePerToken || !tokens) return "0";
    const amount = parseEther(tokens);
    const total = (amount * BigInt(pricePerToken.toString())) / 10n ** 18n;
    return formatEther(total);
  }, [pricePerToken, tokens]);

  const supplyLeft = useMemo(() => {
    if (!availableSupply) return "0";
    return (Number(availableSupply) / 1e18).toFixed(2);
  }, [availableSupply]);

  const handleBuy = async () => {
    if (!tokens) return;
    const amount = parseEther(tokens);
    await buy(amount);
    onClose();
    setTokens("1");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Buy property tokens
            </p>
            <h3 className="text-2xl font-semibold text-white">{asset.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-white hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm text-slate-200">
          <label className="block text-xs uppercase tracking-widest text-slate-400">
            Tokens to buy (1 token = fractional ownership)
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={tokens}
            onChange={(e) => setTokens(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
            <p>
              Est. cost: <span className="text-emerald-300">{cost}</span> ETH
            </p>
            <p className="mt-2 text-slate-400">
              Available supply in treasury: <span className="text-white">{supplyLeft}</span> tokens.
              Current primary price is fixed at 0.0001 ETH per token for demo purposes.
            </p>
            <p className="mt-2 text-slate-500 text-[11px]">
              Ensure your wallet points to Sepolia and has enough ETH to cover the purchase plus gas.
            </p>
          </div>

          <button
            onClick={handleBuy}
            className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 shadow-md shadow-emerald-400/40 transition hover:bg-emerald-400"
          >
            Confirm purchase
          </button>
        </div>

        <div className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-[11px] text-slate-400">
          <p className="text-xs uppercase tracking-widest text-slate-500">Setup checklist</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Offering contract address registered in compliance registry.</li>
            <li>Offering owns enough ERC-3643 tokens (transfer inventory).</li>
            <li>Your wallet on Sepolia with ETH for funding + gas.</li>
            <li>Optional: offering seeded with some ETH so secondary sell can work later.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

