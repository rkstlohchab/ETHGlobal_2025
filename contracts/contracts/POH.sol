// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/**
 * @title ProofOfHuman
 * @notice RWA Property Platform implementation of SelfVerificationRoot
 * @dev This contract provides identity verification for property investments
 */
contract ProofOfHuman is SelfVerificationRoot {
    // Storage for verification configuration
    SelfStructs.VerificationConfigV2 public verificationConfig;
    bytes32 public verificationConfigId;

    // Events
    event VerificationCompleted(
        ISelfVerificationRoot.GenericDiscloseOutputV2 output,
        bytes userData
    );

    /**
     * @notice Constructor for the RWA Property Platform verification
     * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param scopeSeed Unique scope seed for this application
     */
    constructor(
        address identityVerificationHubV2Address,
        uint256 scopeSeed
    ) SelfVerificationRoot(identityVerificationHubV2Address, scopeSeed) {
        // Configure verification requirements for RWA property investments
        verificationConfig = SelfStructs.VerificationConfigV2({
            olderThanEnabled: true,
            olderThan: 18, // Must be 18+ to invest
            forbiddenCountriesEnabled: true,
            forbiddenCountriesListPacked: _packCountries(), // Sanctioned countries
            ofacEnabled: [true, true, true] // Enable all OFAC checks
        });
        
        // For testing, we'll set a mock config ID
        // In production, this would be set by the Identity Hub
        verificationConfigId = keccak256(abi.encode(verificationConfig, block.timestamp));
    }
    
    /**
     * @notice Pack sanctioned country codes for verification
     * @dev Packs country codes into the required format
     * @return Packed country codes as uint256[4] array
     */
    function _packCountries() private pure returns (uint256[4] memory) {
        // This is a simplified implementation
        // In production, you would pack actual ISO country codes
        // for sanctioned countries (Cuba, Iran, North Korea, Russia, Syria)
        return [uint256(0), uint256(0), uint256(0), uint256(0)];
    }
    
    /**
     * @notice Implementation of customVerificationHook for testing
     * @dev This function is called by onVerificationSuccess after hub address validation
     * @param output The verification output from the hub
     * @param userData The user data passed through verification
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        emit VerificationCompleted(output, userData);
    }

    function getConfigId(
        bytes32 /* destinationChainId */,
        bytes32 /* userIdentifier */,
        bytes memory /* userDefinedData */
    ) public view override returns (bytes32) {
        return verificationConfigId;
    }
}