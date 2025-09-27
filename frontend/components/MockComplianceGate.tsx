"use client";

import { useState } from "react";

type ComplianceStep = "profile" | "kyc" | "accreditation" | "ready";

const STEP_DETAILS: Record<ComplianceStep, { title: string; description: string }> = {
  profile: {
    title: "1. Create investor profile",
    description: "Collect basic details (name, email, jurisdiction).",
  },
  kyc: {
    title: "2. Verify identity",
    description:
      "Upload passport/Aadhaar, proof of address, and run sanctions screening. For the demo we mock this with a one-click approval.",
  },
  accreditation: {
    title: "3. Investor eligibility",
    description: "Capture accreditation or investment limits, depending on jurisdiction.",
  },
  ready: {
    title: "4. Ready to invest",
    description: "Once the compliance agent signs off, wallet is authorized in the ERC-3643 identity registry.",
  },
};

export function MockComplianceGate() {
  const [step, setStep] = useState<ComplianceStep>("profile");

  const advance = () => {
    if (step === "profile") setStep("kyc");
    else if (step === "kyc") setStep("accreditation");
    else if (step === "accreditation") setStep("ready");
  };

  const reset = () => setStep("profile");

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Mocked Compliance Journey</h2>
          <p className="text-xs text-slate-300">Simulate the investor onboarding flow. Replace this module later with live KYC callbacks.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={advance}
            disabled={step === "ready"}
            className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-lg shadow-cyan-400/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {step === "ready" ? "Completed" : "Advance step"}
          </button>
          <button
            onClick={reset}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-white hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 text-sm text-slate-200 md:grid-cols-4">
        {Object.entries(STEP_DETAILS).map(([key, value]) => (
          <div
            key={key}
            className={`rounded-xl border p-4 transition ${
              step === key
                ? "border-cyan-400/60 bg-cyan-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {value.title}
            </p>
            <p className="mt-2 text-xs text-slate-300">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
        <p className="font-semibold text-white">Current status:</p>
        <p className="mt-1 text-sm text-emerald-300">
          {step === "ready"
            ? "Wallet is whitelisted. Token transfers succeed."
            : "Wallet not authorized yet. ERC-3643 compliance would revert transfers."}
        </p>
        <p className="mt-3 text-slate-400">
          Under the hood, ERC-3643’s IdentityRegistry stores country code and claims for each wallet. When you replace this mock with a real provider, simply call the registry & claim issuer contracts during these steps.
        </p>
      </div>
    </div>
  );
}

