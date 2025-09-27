"use client";

import { useAccount } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { useTokenSnapshot } from "@/hooks/useTokenSnapshot";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function PortfolioOverview() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const { loading, balance, usdValue, price, publishTime } = useTokenSnapshot();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedValue = useMemo(() => {
    if (!usdValue) return "—";
    return formatter.format(Number(usdValue));
  }, [usdValue]);

  const formattedPrice = useMemo(() => {
    if (!price) return "—";
    return formatter.format(Number(price));
  }, [price]);

  // Prevent hydration issues by showing consistent loading state
  const isLoading = !mounted || loading;

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Portfolio snapshot
          </p>
          <h2 className="text-2xl font-semibold text-white">Your holdings</h2>
          <p className="text-sm text-slate-300">
            Wallet: {!mounted || !address ? (
              "Not connected"
            ) : (
              <span className="font-mono text-slate-200">{address.slice(0, 6)}…{address.slice(-4)}</span>
            )}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Token balance"
            value={isLoading ? "Loading..." : balance ?? "0"}
            tooltip="Current ERC-3643 token balance for this wallet."
          />
          <MetricCard
            label="USD valuation"
            value={isLoading ? "Loading..." : formattedValue}
            tooltip="Balance converted using the latest Pyth oracle price."
          />
          <MetricCard
            label="ETH/USD (Pyth)"
            value={isLoading ? "Loading..." : formattedPrice}
            tooltip={`Last update: ${publishTime ?? "—"}`}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
        {label}
        {tooltip && <span className="text-slate-500">•</span>}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      {tooltip && <p className="mt-1 text-[11px] text-slate-400">{tooltip}</p>}
    </div>
  );
}
