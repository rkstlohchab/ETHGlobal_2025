import { AssetCard } from "@/components/cards/AssetCard";
import { MOCK_ASSETS } from "@/data/mockAssets";

export function AssetGrid() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Featured assets</h3>
          <p className="text-sm text-slate-300">Curated opportunities ready for tokenized investment. Compliance is mocked; replace with live datasets later.</p>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
        {MOCK_ASSETS.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
}

