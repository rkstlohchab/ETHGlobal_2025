import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import type { MockAsset } from "@/data/mockAssets";
import { useOffering } from "@/hooks/useOffering";
import { useSelfVerification } from "@/hooks/useSelfVerification";
import { formatEther } from "viem";
import { AssetBuyModal } from "@/components/modals/AssetBuyModal";
import { useAccount } from "wagmi";

export function AssetCard({ asset }: { asset: MockAsset }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { address } = useAccount();
  const { verified, loading } = useSelfVerification();
  const { pricePerToken, totalRaised } = useOffering(
    asset.offeringAddress,
    asset.tokenAddress
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const raiseProgress = useMemo(() => {
    if (!totalRaised) return 0;
    const raised = Number(totalRaised) / 1e18;
    const target = Number(asset.targetRaiseWei) / 1e18;
    return Math.min(100, (raised / target) * 100);
  }, [totalRaised, asset.targetRaiseWei]);

  const formattedPrice = pricePerToken
    ? `$${(Number(pricePerToken) / 1e18).toFixed(2)} / token`
    : "—";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-cyan-400/50 hover:bg-white/10">
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={asset.image}
          alt={asset.name}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0" />
        <div className="absolute bottom-4 left-4 flex flex-col">
          <span className="text-sm font-semibold text-white">
            {asset.name}
          </span>
          <span className="text-xs uppercase tracking-widest text-slate-200">
            {asset.location}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 text-xs text-slate-300">
        <p>{asset.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <dt className="uppercase tracking-widest text-slate-500">Valuation</dt>
            <dd className="text-sm font-semibold text-white">${asset.valuation.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-slate-500">Yield (est.)</dt>
            <dd className="text-sm font-semibold text-emerald-300">{asset.estimatedYield}%</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-slate-500">Tokens minted</dt>
            <dd className="font-mono text-sm text-slate-200">{asset.tokensMinted.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-slate-500">Price</dt>
            <dd className="text-sm font-semibold text-cyan-300">{formattedPrice}</dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
              style={{ width: `${raiseProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Raised: {totalRaised ? formatEther(totalRaised).slice(0, 8) : "0"} ETH</span>
            <span>Target: {formatEther(BigInt(asset.targetRaiseWei)).slice(0, 8)} ETH</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {asset.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-auto space-y-2">
          {!mounted ? (
            // Loading state to prevent hydration issues
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400">Loading verification status...</p>
            </div>
          ) : !address ? (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-center">
              <p className="text-xs text-amber-300">Connect wallet to invest</p>
            </div>
          ) : !verified ? (
            <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-3 text-center">
              <p className="text-xs text-blue-300">Complete Self verification to invest</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs text-blue-200">Zero-knowledge KYC required</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-green-400/20 bg-green-400/5 p-2">
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-green-300">Self verified ✓</span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setOpen(true)}
            disabled={
              !mounted ||
              !asset.offeringAddress || 
              asset.offeringAddress === "0x0000000000000000000000000000000000000000" || 
              !address || 
              !verified ||
              loading
            }
            className="w-full rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-md shadow-cyan-400/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {!mounted ? "Loading..." : loading ? "Checking verification..." : verified ? "Buy tokens" : "Verification required"}
          </button>
        </div>
      </div>

      <AssetBuyModal
        asset={asset}
        open={open}
        onClose={() => setOpen(false)}
      />
    </article>
  );
}
