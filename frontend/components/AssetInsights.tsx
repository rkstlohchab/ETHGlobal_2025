import { InsightsCard } from "@/components/cards/InsightsCard";

const INSIGHTS = [
  {
    title: "Liquidity window",
    body: "Secondary trading is open Tuesdays & Thursdays via the compliance-approved AMM. Settlement runs through ERC-3643 checks automatically.",
  },
  {
    title: "Oracle health",
    body: "Pyth ETH/USD feed updates every 30 seconds. Add TWAP modules later if you require tighter risk controls.",
  },
  {
    title: "Compliance roadmap",
    body: "Swap mocked flow with a real KYC provider (Sumsub, Persona, Tokeny), then issue claims to the identity registry inside your onboarding webhook.",
  },
];

export function AssetInsights() {
  return (
    <aside className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Operations</h3>
      <div className="space-y-4">
        {INSIGHTS.map((item) => (
          <InsightsCard key={item.title} {...item} />
        ))}
      </div>
    </aside>
  );
}

