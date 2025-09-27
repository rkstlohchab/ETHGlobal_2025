"use client";

import { MockAsset } from "@/data/mockAssets";
import { useOffering } from "@/hooks/useOffering";
import { useState, useMemo } from "react";
import { formatEther, parseEther } from "viem";

type Props = {
  asset: MockAsset;
  mode: "buy" | "sell" | null;
  onClose: () => void;
};

export function AssetTradeModal({ asset, mode, onClose }: Props) {
  const [amount, setAmount] = useState<string>("");
  const { pricePerToken, buy, sell } = useOffering(
    asset.offeringAddress,
    asset.tokenAddress
  );

  const costPreview = useMemo(() => {
    if (!amount || !pricePerToken) return "0";
    const tokenAmount = parseEther(amount);
    const cost = (tokenAmount * BigInt(pricePerToken.toString())) / 10n ** 18n;
    return formatEther(cost);
  }, [amount, pricePerToken]);

  if (!mode) return null;

  const handleSubmit = async () => {
    if (!amount) return;
    const tokenAmount = parseEther(amount);
    if (mode === "buy") {
      await buy(tokenAmount);
    } else {
      await sell(tokenAmount);
    }
    setAmount("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {mode === "buy" ? "Invest in" : "Sell shares"}
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
            Token amount (whole tokens)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
            {mode === "buy" ? (
              <p>
                You will pay approximately <span className="text-emerald-300">{costPreview}</span> ETH.
              </p>
            ) : (
              <p>
                You will receive approximately <span className="text-emerald-300">{costPreview}</span> ETH (before fees).
              </p>
            )}
            <p className="mt-2 text-slate-400">
              {mode === "buy"
                ? "Upon confirmation, your wallet will receive ERC-3643 tokens representing this property."
                : "Tokens will be transferred back to the property treasury and ETH returned to your wallet."}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 shadow-md shadow-emerald-400/40 transition hover:bg-emerald-400"
          >
            {mode === "buy" ? "Confirm investment" : "Confirm sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

