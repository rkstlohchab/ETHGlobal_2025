"use client";

import { Suspense } from "react";
import { ConnectPanel } from "@/components/ConnectPanel";
import { MockComplianceGate } from "@/components/MockComplianceGate";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { AssetGrid } from "@/components/AssetGrid";
import { AssetInsights } from "@/components/AssetInsights";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-24">
        <header className="pt-10 pb-12">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
                  Real World Assets
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Tokenized Real Estate Dashboard
                </h1>
                <p className="max-w-2xl text-sm text-slate-300">
                  Monitor tokenized properties, view real-time Pyth oracle valuations, and guide investors through the compliance journey. All compliance steps are mocked, so you can demonstrate the experience now and plug in a real KYC provider later.
                </p>
              </div>
              <ConnectPanel />
            </div>
            <MockComplianceGate />
          </div>
        </header>

        <Suspense fallback={<div className="text-slate-400">Loading analytics...</div>}>
          <section className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-10">
              <PortfolioOverview />
              <AssetGrid />
            </div>
            <AssetInsights />
          </section>
        </Suspense>
      </div>
    </main>
  );
}
