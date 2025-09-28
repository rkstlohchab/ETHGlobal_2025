'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
  countries,
} from "@selfxyz/qrcode";
import { useAccount } from 'wagmi';

interface SelfKycProps {
  onVerificationSuccess?: (verificationData: Record<string, unknown>) => void;
  onVerificationError?: (error: string) => void;
  propertyId?: string;
  minimumInvestment?: string;
}

export function SelfKyc({ 
  onVerificationSuccess, 
  onVerificationError,
  propertyId,
  minimumInvestment 
}: SelfKycProps) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!address || !mounted) return;

    try {
      const userDefinedData = JSON.stringify({
        propertyId: propertyId || 'general',
        minimumInvestment: minimumInvestment || '0.01',
        timestamp: Date.now(),
        platform: 'RWA Property Platform'
      });

      const app = new SelfAppBuilder({
        version: 2,
        appName: "RWA Property Platform",
        scope: "rwa-property-platform",
        endpoint: "/api/verify", // Your backend endpoint
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: address,
        endpointType: "staging_https", // Use staging for development
        userIdType: "hex", // Ethereum addresses are hex
        userDefinedData: userDefinedData,
        disclosures: {
          // Age verification for investment compliance
          minimumAge: 18,
          
          // Geographic compliance - exclude sanctioned countries
          excludedCountries: [
            countries.CUBA,
            countries.IRAN, 
            countries.NORTH_KOREA,
            countries.RUSSIA,
            countries.SYRIAN_ARAB_REPUBLIC
          ],
          
          // Required disclosures for KYC
          nationality: true,
          gender: true,
          
          // OFAC sanctions check
          ofac: true,
        }
      }).build();

  setSelfApp(app);
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      setErrorMessage("Failed to initialize verification system");
      setVerificationStatus('error');
    }
  }, [address, propertyId, minimumInvestment, mounted]);

  const handleSuccessfulVerification = useCallback(async () => {
    console.log("Self verification successful");
    setVerificationStatus('success');
    let verificationData: Record<string, unknown> | undefined;
    if (address) {
      try {
        const response = await fetch(`/api/verify?address=${address}`);
        if (response.ok) {
          verificationData = await response.json();
        } else {
          console.warn("Failed to fetch verification status", response.status);
        }
      } catch (fetchError) {
        console.error("Failed to retrieve verification status:", fetchError);
      }
    }
    
    // Store verification status in localStorage for persistence
    if (address) {
      localStorage.setItem(`self_verified_${address}`, JSON.stringify({
        verified: true,
        timestamp: Date.now(),
        propertyId: propertyId || 'general',
        verificationData
      }));
    }
    
    onVerificationSuccess?.(verificationData ?? {});
  }, [address, propertyId, onVerificationSuccess]);

  const handleVerificationError = useCallback((error: Error | unknown) => {
    console.error("Self verification error:", error);
    setVerificationStatus('error');
    const errorMessage = error instanceof Error ? error.message : "Verification failed";
    setErrorMessage(errorMessage);
    onVerificationError?.(errorMessage);
  }, [onVerificationError]);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-slate-300">Loading verification system...</span>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20">
            <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-300">Connect Wallet Required</h3>
            <p className="text-sm text-amber-200/80">
              Please connect your wallet to proceed with identity verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400/20">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-300">Identity Verification Required</h3>
            <p className="text-sm text-blue-200/80">
              Complete KYC verification to invest in tokenized real estate properties
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Age verification (18+ required)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Geographic compliance check</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>OFAC sanctions screening</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Zero-knowledge privacy protection</span>
          </div>
        </div>

        {verificationStatus === 'success' && (
          <div className="mb-4 rounded-lg border border-green-400/20 bg-green-400/10 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-green-300">Verification Complete!</span>
            </div>
            <p className="mt-1 text-sm text-green-200/80">
              You can now invest in tokenized properties on our platform.
            </p>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-red-300">Verification Failed</span>
            </div>
            <p className="mt-1 text-sm text-red-200/80">
              {errorMessage}
            </p>
          </div>
        )}

        {selfApp && verificationStatus !== 'success' ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-lg bg-white p-4">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSuccessfulVerification}
                onError={handleVerificationError}
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200">Scan with Self app</p>
              <p className="mt-1 text-xs text-slate-400">
                Download the Self app from your app store to get started
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <a 
                href="https://apps.apple.com/app/self-xyz/id6443672479" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              >
                <span>📱</span>
                <span>iOS App</span>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=xyz.self.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
              >
                <span>🤖</span>
                <span>Android App</span>
              </a>
            </div>
          </div>
        ) : verificationStatus !== 'success' && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-slate-300">Loading verification system...</span>
          </div>
        )}
      </div>
    </div>
  );
}
