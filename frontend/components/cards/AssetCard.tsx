import Image from "next/image";
import { useMemo, useState } from "react";
import type { MockAsset } from "@/data/mockAssets";
import { useOffering } from "@/hooks/useOffering";
import { formatEther } from "viem";
import { AssetBuyModal } from "@/components/modals/AssetBuyModal";

export function AssetCard({ asset }: { asset: MockAsset }) {
  const [open, setOpen] = useState(false);
  const { pricePerToken, totalRaised } = useOffering(
    asset.offeringAddress,
    asset.tokenAddress
  );

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
        <div className="mt-auto">
          <button
            onClick={() => setOpen(true)}
            disabled={!asset.offeringAddress || asset.offeringAddress === "0x0000000000000000000000000000000000000000"}
            className="w-full rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-md shadow-cyan-400/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            Buy tokens
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

