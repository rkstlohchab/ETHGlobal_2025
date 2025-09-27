'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useSelfVerification } from '@/hooks/useSelfVerification';

interface SelfVerifiedPropertyOfferingProps {
  offeringAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  propertyName: string;
  pricePerToken: bigint;
  availableTokens: bigint;
}

export function SelfVerifiedPropertyOffering({
  offeringAddress,
  tokenAddress,
  propertyName,
  pricePerToken,
  availableTokens,
}: SelfVerifiedPropertyOfferingProps) {
  const [amount, setAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  
  const { address } = useAccount();
  const { verified, loading: verificationLoading, compliance } = useSelfVerification();
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const canInvest = address && verified && compliance?.kycComplete;
  const tokenAmount = amount ? parseEther(amount) : 0n;
  const totalCost = (tokenAmount * pricePerToken) / parseEther('1');

  const handleInvest = async () => {
    if (!canInvest || !amount || tokenAmount === 0n) return;

    try {
      setIsInvesting(true);
      
      // Call the PropertyOffering contract's buy function
      writeContract({
        address: offeringAddress,
        abi: [
          {
            name: 'buy',
            type: 'function',
            stateMutability: 'payable',
            inputs: [{ name: 'tokenAmount', type: 'uint256' }],
            outputs: [],
          },
        ],
        functionName: 'buy',
        args: [tokenAmount],
        value: totalCost,
      });
    } catch (error) {
      console.error('Investment failed:', error);
      setIsInvesting(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setIsInvesting(false);
      setAmount('');
    }
  }, [isSuccess]);

  if (verificationLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-slate-300">Checking verification status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{propertyName} Investment</h3>
          <p className="text-sm text-slate-300">
            Self Protocol verified investment opportunity
          </p>
        </div>
        {verified && (
          <div className="flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1">
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-green-300">Verified</span>
          </div>
        )}
      </div>

      {!address ? (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-center">
          <svg className="mx-auto h-8 w-8 text-amber-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h4 className="font-semibold text-amber-300">Wallet Connection Required</h4>
          <p className="text-sm text-amber-200/80 mt-1">
            Please connect your wallet to invest in this property.
          </p>
        </div>
      ) : !verified ? (
        <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-4 text-center">
          <svg className="mx-auto h-8 w-8 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h4 className="font-semibold text-blue-300">Identity Verification Required</h4>
          <p className="text-sm text-blue-200/80 mt-1">
            Complete Self Protocol verification to invest in tokenized real estate.
          </p>
          <p className="text-xs text-blue-200/60 mt-2">
            Zero-knowledge KYC • Privacy preserved • Regulatory compliant
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Price per Token</p>
              <p className="font-semibold text-white">
                {formatEther(pricePerToken)} ETH
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Available</p>
              <p className="font-semibold text-white">
                {formatEther(availableTokens)} tokens
              </p>
            </div>
          </div>

          {compliance && (
            <div className="rounded-lg border border-green-400/20 bg-green-400/5 p-3">
              <p className="text-xs font-semibold text-green-300 mb-2">Verification Status</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className={compliance.ageVerified ? "text-green-300" : "text-red-300"}>
                    {compliance.ageVerified ? "✅" : "❌"}
                  </span>
                  <span>Age 18+</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={compliance.geographicCompliant ? "text-green-300" : "text-red-300"}>
                    {compliance.geographicCompliant ? "✅" : "❌"}
                  </span>
                  <span>Geographic</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={compliance.ofacClean ? "text-green-300" : "text-red-300"}>
                    {compliance.ofacClean ? "✅" : "❌"}
                  </span>
                  <span>OFAC Clean</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={compliance.kycComplete ? "text-green-300" : "text-red-300"}>
                    {compliance.kycComplete ? "✅" : "❌"}
                  </span>
                  <span>KYC</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Investment Amount (tokens)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {amount && tokenAmount > 0n && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Total Cost:</span>
                  <span className="font-semibold text-white">
                    {formatEther(totalCost)} ETH
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleInvest}
              disabled={
                !canInvest || 
                !amount || 
                tokenAmount === 0n || 
                isPending || 
                isConfirming || 
                isInvesting
              }
              className="w-full rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-900 shadow-lg shadow-cyan-400/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {isPending || isConfirming || isInvesting
                ? "Processing Investment..."
                : isSuccess
                ? "Investment Successful!"
                : "Invest in Property"
              }
            </button>

            {isSuccess && (
              <div className="rounded-lg border border-green-400/20 bg-green-400/10 p-3 text-center">
                <p className="text-sm font-semibold text-green-300">
                  🎉 Investment completed successfully!
                </p>
                <p className="text-xs text-green-200/80 mt-1">
                  Your property tokens have been minted to your wallet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-300 mb-1">Self Protocol Integration Benefits:</p>
        <ul className="space-y-1">
          <li>• Privacy-preserving identity verification</li>
          <li>• Automated regulatory compliance</li>
          <li>• Zero-knowledge age and nationality proofs</li>
          <li>• OFAC sanctions screening</li>
          <li>• ERC-3643 compliant token transfers</li>
        </ul>
      </div>
    </div>
  );
}
