import Image from "next/image";
import type { MockAsset } from "@/data/mockAssets";

export function AssetCard({ asset }: { asset: MockAsset }) {
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
            <dt className="uppercase tracking-widest text-slate-500">Compliance</dt>
            <dd className="text-sm font-semibold text-cyan-300">Mocked ✅</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap gap-2">
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
    </article>
  );
}

