# Self Protocol Integration Guide

This document explains the complete Self Protocol integration for the RWA Property Platform.

## Overview

Self Protocol provides privacy-preserving identity verification using zero-knowledge proofs. This integration enables:

- **Age verification** (18+ required for investment)
- **Geographic compliance** (excluding sanctioned countries)
- **OFAC sanctions screening**
- **Privacy-preserving KYC/AML compliance**
- **ERC-3643 token compliance readiness**

## Architecture

### Frontend Components

1. **SelfKyc.tsx** - Main verification component with QR code
2. **MockComplianceGate.tsx** - Compliance workflow integration
3. **useSelfVerification.ts** - React hook for verification status
4. **AssetCard.tsx** - Verification-gated investment interface

### Backend API

- **`/api/verify`** - Handles Self Protocol verification callbacks
- **GET** - Check verification status by address
- **POST** - Process verification proofs

### Smart Contracts

- **ProofOfHuman.sol** - Self Protocol verification contract
- **PropertyOffering.sol** - Investment contract with compliance

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` in the frontend directory:

```env
# Self Protocol Configuration
NEXT_PUBLIC_SELF_APP_NAME="RWA Property Platform"
NEXT_PUBLIC_SELF_SCOPE="rwa-property-platform"
NEXT_PUBLIC_SELF_ENDPOINT="/api/verify"

# Contract addresses (update after deployment)
NEXT_PUBLIC_SELF_VERIFIER_CONTRACT="0x..."
NEXT_PUBLIC_PROPERTY_OFFERING_CONTRACT="0x..."
```

### 2. Contract Deployment

Deploy the Self-integrated contracts:

```bash
cd contracts
npx hardhat run scripts/deploy-self-integrated.js --network sepolia
```

### 3. Frontend Setup

The frontend is already configured with Self Protocol integration:

- QR code verification flow
- Verification status checking
- Investment gating based on verification
- Compliance status display

### 4. Testing

Run the test suite:

```bash
# Smart contract tests
cd contracts
npx hardhat test test/SelfIntegration.test.js

# Frontend development
cd frontend
npm run dev
```

## User Flow

1. **Connect Wallet** - User connects their Ethereum wallet
2. **Start Verification** - Click "Next Step" in compliance section
3. **Scan QR Code** - Use Self app to scan verification QR code
4. **Complete Verification** - Provide passport/ID via Self app
5. **Receive Confirmation** - Zero-knowledge proof verified
6. **Invest in Properties** - Access unlocked for verified users

## Self Protocol Configuration

### Verification Requirements

```javascript
{
  minimumAge: 18,                    // Age verification
  excludedCountries: [               // Sanctioned countries
    "CUB", "IRN", "PRK", "RUS", "SYR"
  ],
  ofac: true,                        // OFAC sanctions check
  nationality: true,                 // Nationality disclosure
  gender: true                       // Gender disclosure
}
```

### Privacy Features

- **Zero-knowledge proofs** - No personal data shared
- **Selective disclosure** - Only required fields revealed
- **Local verification** - Proof verified on-device
- **Cryptographic privacy** - Identity protected

## API Reference

### Verification Endpoint

**POST `/api/verify`**

Request:
```json
{
  "attestationId": "1",
  "proof": "...",
  "publicSignals": [...],
  "userContextData": "{...}"
}
```

Response:
```json
{
  "status": "success",
  "verified": true,
  "compliance": {
    "ageVerified": true,
    "geographicCompliant": true,
    "ofacClean": true,
    "kycComplete": true
  }
}
```

**GET `/api/verify?address=0x...`**

Response:
```json
{
  "verified": true,
  "timestamp": 1234567890,
  "compliance": { ... }
}
```

## Integration Benefits

### For Users
- **Privacy preserved** - No personal data stored
- **Fast verification** - Complete in minutes
- **Global access** - Works with any passport
- **Regulatory compliant** - Meets KYC/AML requirements

### For Platform
- **Automated compliance** - No manual KYC review
- **Reduced liability** - Self handles verification
- **Global scaling** - Support all countries
- **Cost effective** - No per-verification fees

### For Regulators
- **Audit trail** - Cryptographic verification proofs
- **Compliance assurance** - OFAC and sanctions screening
- **Privacy compliant** - GDPR and data protection
- **Real-time verification** - Instant compliance checks

## Deployment Checklist

- [ ] Deploy ProofOfHuman contract
- [ ] Deploy PropertyOffering contract
- [ ] Configure Self Protocol settings
- [ ] Update frontend environment variables
- [ ] Test verification flow end-to-end
- [ ] Verify contract interactions
- [ ] Set up monitoring and alerts

## Troubleshooting

### Common Issues

1. **QR Code not loading**
   - Check Self app installation
   - Verify network connectivity
   - Confirm endpoint configuration

2. **Verification failing**
   - Ensure passport is NFC-enabled
   - Check country eligibility
   - Verify app permissions

3. **Investment blocked**
   - Confirm wallet connection
   - Check verification status
   - Verify contract addresses

### Support Resources

- [Self Protocol Documentation](https://docs.self.xyz)
- [Self Discord Community](https://discord.gg/self)
- [GitHub Issues](https://github.com/selfxyz/self)

## Next Steps

1. **Production Deployment**
   - Deploy to mainnet
   - Configure production Self endpoints
   - Set up monitoring

2. **Enhanced Features**
   - Additional compliance checks
   - Multi-chain support
   - Advanced analytics

3. **Integration Expansion**
   - ERC-3643 identity registry
   - Cross-platform verification
   - Enterprise features

## Security Considerations

- **Smart Contract Audits** - Audit all contracts before mainnet
- **API Security** - Implement rate limiting and authentication
- **Data Protection** - Minimize data storage and retention
- **Access Controls** - Implement proper permission systems
- **Monitoring** - Set up security monitoring and alerts

---

For technical support or questions about this integration, please refer to the [Self Protocol documentation](https://docs.self.xyz) or contact the development team.
