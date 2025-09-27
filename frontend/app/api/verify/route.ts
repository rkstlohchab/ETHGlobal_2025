// app/api/verify/route.ts
import { NextResponse } from "next/server";
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// Enhanced configuration for RWA platform compliance
const selfBackendVerifier = new SelfBackendVerifier(
  "rwa-property-platform", // Updated scope to match frontend
  "https://staging.self.xyz/api/verify", // Use staging for development
  true, // mockPassport: true for staging/testnet, false for mainnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: ["CUB", "IRN", "PRK", "RUS", "SYR"], // Sanctioned countries
    ofac: true, // OFAC sanctions check
    nationality: true,
    gender: true,
  }),
  "hex" // userIdentifierType for Ethereum addresses
);

// In-memory store for verification results (use Redis/database in production)
const verificationStore = new Map<string, any>();

export async function POST(req: Request) {
  try {
    console.log("Self verification request received");
    
    // Extract data from the request
    const { attestationId, proof, publicSignals, userContextData } = await req.json();

    console.log("Verification request data:", {
      attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      userContextData
    });

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      console.error("Missing required verification fields");
      return NextResponse.json(
        {
          status: "error",
          result: false,
          message: "Proof, publicSignals, attestationId and userContextData are required",
          error_code: "MISSING_FIELDS"
        },
        { status: 400 }
      );
    }

    // Parse user context data to extract wallet address and property info
    let parsedUserData;
    try {
      parsedUserData = JSON.parse(userContextData);
    } catch (e) {
      console.error("Failed to parse userContextData:", e);
      parsedUserData = { userContextData }; // Fallback
    }

    console.log("Parsed user data:", parsedUserData);

    // Verify the proof using Self's backend verifier
    const result = await selfBackendVerifier.verify(
      attestationId,    // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof,            // The zero-knowledge proof
      publicSignals,    // Public signals array
      userContextData   // User context data (hex string)
    );

    console.log("Self verification result:", {
      isValid: result.isValidDetails.isValid,
      discloseOutput: result.discloseOutput
    });

    // Check if verification was successful
    if (result.isValidDetails.isValid) {
      // Extract wallet address from user context or public signals
      const walletAddress = parsedUserData.userId || parsedUserData.walletAddress;
      
      // Store verification result for future reference
      if (walletAddress) {
        const verificationRecord = {
          address: walletAddress,
          verified: true,
          timestamp: Date.now(),
          attestationId,
          credentialSubject: result.discloseOutput,
          propertyId: parsedUserData.propertyId || 'general',
          platform: parsedUserData.platform || 'RWA Property Platform'
        };
        
        verificationStore.set(walletAddress.toLowerCase(), verificationRecord);
        console.log(`Verification stored for address: ${walletAddress}`);
      }

      // Verification successful - return detailed result
      return NextResponse.json({
        status: "success",
        result: true,
        verified: true,
        timestamp: Date.now(),
        credentialSubject: result.discloseOutput,
        compliance: {
          ageVerified: result.discloseOutput.minimumAge >= 18,
          geographicCompliant: !result.discloseOutput.excludedCountries?.length,
          ofacClean: result.discloseOutput.ofac !== false,
          kycComplete: true
        },
        message: "Identity verification completed successfully"
      });
    } else {
      // Verification failed - return detailed error
      console.error("Self verification failed:", result.isValidDetails);
      
      return NextResponse.json(
        {
          status: "error",
          result: false,
          verified: false,
          reason: "Identity verification failed",
          error_code: "VERIFICATION_FAILED",
          details: result.isValidDetails,
          message: "The provided identity proof could not be verified"
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Self verification error:", error);
    
    return NextResponse.json(
      {
        status: "error",
        result: false,
        verified: false,
        reason: error instanceof Error ? error.message : "Unknown verification error",
        error_code: "VERIFICATION_ERROR",
        message: "An error occurred during identity verification"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    const verification = verificationStore.get(address.toLowerCase());
    
    if (verification) {
      return NextResponse.json({
        verified: true,
        timestamp: verification.timestamp,
        propertyId: verification.propertyId,
        compliance: {
          ageVerified: verification.credentialSubject.minimumAge >= 18,
          geographicCompliant: !verification.credentialSubject.excludedCountries?.length,
          ofacClean: verification.credentialSubject.ofac !== false,
          kycComplete: true
        }
      });
    } else {
      return NextResponse.json({
        verified: false,
        message: "No verification found for this address"
      });
    }
  } catch (error) {
    console.error("Error checking verification status:", error);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}
