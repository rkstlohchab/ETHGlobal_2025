"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { SelfKyc } from "./SelfKyc";
import { useSelfVerification } from "../hooks/useSelfVerification";

type ComplianceStep = "profile" | "kyc" | "accreditation" | "ready";

const STEP_DETAILS: Record<ComplianceStep, { title: string; description: string }> = {
  profile: {
    title: "1. Create investor profile",
    description: "Collect basic details (name, email, jurisdiction).",
  },
  kyc: {
    title: "2. Verify identity with Self Protocol",
    description:
      "Complete zero-knowledge identity verification using Self Protocol. Verify age, nationality, and sanctions screening while preserving privacy.",
  },
  accreditation: {
    title: "3. Investor eligibility",
    description: "Capture accreditation or investment limits, depending on jurisdiction.",
  },
  ready: {
    title: "4. Ready to invest",
    description: "Once verification is complete, wallet is authorized for property investments.",
  },
};

export function MockComplianceGate() {
  const [step, setStep] = useState<ComplianceStep>("profile");
  const [showSelfKyc, setShowSelfKyc] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { address } = useAccount();
  const { verified, loading, compliance, markAsVerified, clearVerification } = useSelfVerification();

  // Fix hydration by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const advance = () => {
    if (step === "profile") {
      if (address && !verified) {
        setShowSelfKyc(true);
        setStep("kyc");
      } else if (verified) {
        setStep("accreditation");
      } else {
        setStep("kyc");
      }
    } else if (step === "kyc" && verified) {
      setStep("accreditation");
    } else if (step === "accreditation") {
      setStep("ready");
    }
  };

  const reset = () => {
    setStep("profile");
    setShowSelfKyc(false);
    clearVerification();
  };

  const handleSelfVerificationSuccess = (verificationData: any) => {
    console.log("Self verification completed:", verificationData);
    markAsVerified(verificationData);
    setShowSelfKyc(false);
    setStep("accreditation");
  };

  const handleSelfVerificationError = (error: string) => {
    console.error("Self verification failed:", error);
    // Keep the user on the KYC step to retry
  };

  const canAdvance = () => {
    if (!mounted) return false; // Prevent hydration issues
    if (step === "profile") return !!address;
    if (step === "kyc") return verified;
    if (step === "accreditation") return verified;
    return false;
  };

  // Don't render complex state-dependent content until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Self Protocol Compliance</h2>
            <p className="text-xs text-slate-300">
              Zero-knowledge identity verification powered by Self Protocol. Complete KYC while preserving your privacy.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              disabled
              className="rounded-full bg-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 cursor-not-allowed"
            >
              Loading...
            </button>
          </div>
        </div>
        <div className="grid gap-4 text-sm text-slate-200 md:grid-cols-4">
          {Object.entries(STEP_DETAILS).map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {value.title}
              </p>
              <p className="mt-2 text-xs text-slate-300">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {verified ? "Self Protocol Compliance ✅" : "Self Protocol Compliance"}
          </h2>
          <p className="text-xs text-slate-300">
            Zero-knowledge identity verification powered by Self Protocol. Complete KYC while preserving your privacy.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={advance}
            disabled={step === "ready" || !canAdvance() || loading}
            className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-lg shadow-cyan-400/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {loading ? "Processing..." : step === "ready" ? "Completed" : "Next Step"}
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
        {Object.entries(STEP_DETAILS).map(([key, value]) => {
          const isCompleted = 
            (key === "profile" && address) ||
            (key === "kyc" && verified) ||
            (key === "accreditation" && verified && step !== "kyc") ||
            (key === "ready" && step === "ready");
            
          return (
            <div
              key={key}
              className={`rounded-xl border p-4 transition ${
                step === key
                  ? "border-cyan-400/60 bg-cyan-500/10"
                  : isCompleted
                  ? "border-green-400/60 bg-green-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  {value.title}
                </p>
                {isCompleted && (
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-300">{value.description}</p>
            </div>
          );
        })}
      </div>

      {/* Self KYC Integration */}
      {showSelfKyc && step === "kyc" && (
        <div className="mt-4">
          <SelfKyc
            onVerificationSuccess={handleSelfVerificationSuccess}
            onVerificationError={handleSelfVerificationError}
            propertyId="general"
            minimumInvestment="0.01"
          />
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
        <p className="font-semibold text-white">Current status:</p>
        
        {!address ? (
          <p className="mt-1 text-sm text-amber-300">
            Please connect your wallet to begin the compliance process.
          </p>
        ) : verified ? (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-emerald-300">
              ✅ Identity verified with Self Protocol! You can now invest in tokenized properties.
            </p>
            {compliance && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={compliance.ageVerified ? "text-green-300" : "text-red-300"}>
                  Age Verified: {compliance.ageVerified ? "✅" : "❌"}
                </div>
                <div className={compliance.geographicCompliant ? "text-green-300" : "text-red-300"}>
                  Geographic: {compliance.geographicCompliant ? "✅" : "❌"}
                </div>
                <div className={compliance.ofacClean ? "text-green-300" : "text-red-300"}>
                  OFAC Clean: {compliance.ofacClean ? "✅" : "❌"}
                </div>
                <div className={compliance.kycComplete ? "text-green-300" : "text-red-300"}>
                  KYC Complete: {compliance.kycComplete ? "✅" : "❌"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-300">
            {step === "ready"
              ? "Wallet is authorized for investments."
              : "Complete identity verification to proceed with investments."}
          </p>
        )}

        <div className="mt-4 space-y-2 text-slate-400">
          <p className="font-medium">About Self Protocol Integration:</p>
          <ul className="space-y-1 text-xs">
            <li>• Zero-knowledge proofs preserve your privacy</li>
            <li>• Passport/ID verification without sharing personal data</li>
            <li>• Automated OFAC sanctions screening</li>
            <li>• Compliant with global KYC/AML requirements</li>
            <li>• Integration ready for ERC-3643 identity registry</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
