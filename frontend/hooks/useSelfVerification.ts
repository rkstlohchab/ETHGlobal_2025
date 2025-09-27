import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface VerificationStatus {
  verified: boolean;
  loading: boolean;
  error: string | null;
  timestamp?: number;
  compliance?: {
    ageVerified: boolean;
    geographicCompliant: boolean;
    ofacClean: boolean;
    kycComplete: boolean;
  };
}

export function useSelfVerification() {
  const [status, setStatus] = useState<VerificationStatus>({
    verified: false,
    loading: false,
    error: null,
  });

  const { address } = useAccount();

  const checkVerificationStatus = useCallback(async () => {
    if (!address) {
      setStatus({
        verified: false,
        loading: false,
        error: null,
      });
      return;
    }

    setStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First check localStorage for cached verification
      const cached = localStorage.getItem(`self_verified_${address}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        if (cachedData.verified && cachedData.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
          // Verification is cached and less than 24 hours old
          setStatus({
            verified: true,
            loading: false,
            error: null,
            timestamp: cachedData.timestamp,
            compliance: {
              ageVerified: true,
              geographicCompliant: true,
              ofacClean: true,
              kycComplete: true,
            }
          });
          return;
        }
      }

      // Check with backend API
      const response = await fetch(`/api/verify?address=${address}`);
      const data = await response.json();

      if (response.ok) {
        setStatus({
          verified: data.verified,
          loading: false,
          error: null,
          timestamp: data.timestamp,
          compliance: data.compliance,
        });

        // Update localStorage cache
        if (data.verified) {
          localStorage.setItem(`self_verified_${address}`, JSON.stringify({
            verified: true,
            timestamp: data.timestamp || Date.now(),
            compliance: data.compliance,
          }));
        }
      } else {
        setStatus({
          verified: false,
          loading: false,
          error: data.error || 'Failed to check verification status',
        });
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setStatus({
        verified: false,
        loading: false,
        error: 'Network error while checking verification status',
      });
    }
  }, [address]);

  const markAsVerified = useCallback((verificationData: any) => {
    if (!address) return;

    const verificationRecord = {
      verified: true,
      timestamp: Date.now(),
      verificationData,
    };

    // Update state
    setStatus({
      verified: true,
      loading: false,
      error: null,
      timestamp: verificationRecord.timestamp,
      compliance: {
        ageVerified: true,
        geographicCompliant: true,
        ofacClean: true,
        kycComplete: true,
      }
    });

    // Update localStorage
    localStorage.setItem(`self_verified_${address}`, JSON.stringify(verificationRecord));
  }, [address]);

  const clearVerification = useCallback(() => {
    if (!address) return;

    setStatus({
      verified: false,
      loading: false,
      error: null,
    });

    localStorage.removeItem(`self_verified_${address}`);
  }, [address]);

  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  return {
    ...status,
    checkVerificationStatus,
    markAsVerified,
    clearVerification,
  };
}
