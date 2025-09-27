// deploy-erc3643-sepolia.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Deploy Claim Topics Registry
  const ClaimTopicsRegistry = await hre.ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  console.log("ClaimTopicsRegistry deployed:", claimTopicsRegistry.target);

  // 2. Deploy Claim Issuers Registry
  const ClaimIssuersRegistry = await hre.ethers.getContractFactory("ClaimIssuersRegistry");
  const claimIssuersRegistry = await ClaimIssuersRegistry.deploy();
  await claimIssuersRegistry.waitForDeployment();
  console.log("ClaimIssuersRegistry deployed:", claimIssuersRegistry.target);

  // 3. Deploy Identity Registry Storage
  const IdentityRegistryStorage = await hre.ethers.getContractFactory("IdentityRegistryStorage");
  const identityRegistryStorage = await IdentityRegistryStorage.deploy();
  await identityRegistryStorage.waitForDeployment();
  console.log("IdentityRegistryStorage deployed:", identityRegistryStorage.target);

  // 4. Deploy Identity Registry
  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy(
    claimIssuersRegistry.target,
    claimTopicsRegistry.target,
    identityRegistryStorage.target
  );
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry deployed:", identityRegistry.target);

  // 5. Deploy Basic Compliance
  const BasicCompliance = await hre.ethers.getContractFactory("BasicCompliance");
  const compliance = await BasicCompliance.deploy();
  await compliance.waitForDeployment();
  console.log("BasicCompliance deployed:", compliance.target);

  // 6. Setup permissions
  const AGENT_ROLE = await identityRegistryStorage.AGENT_ROLE();
  await identityRegistryStorage.grantRole(AGENT_ROLE, identityRegistry.target);
  console.log("Granted AGENT_ROLE to Identity Registry");

  // 7. Deploy Token
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy(
    identityRegistry.target,
    compliance.target,
    "My Security Token",  // name
    "MST",               // symbol
    18,                  // decimals
    deployer.address     // onchainID (using deployer address for demo, you may want to change this)
  );
  await token.waitForDeployment();
  console.log("Token deployed:", token.target);

  // Save addresses
  console.log("\nDeployed Contracts:");
  console.log("ClaimTopicsRegistry:", claimTopicsRegistry.target);
  console.log("ClaimIssuersRegistry:", claimIssuersRegistry.target);
  console.log("IdentityRegistryStorage:", identityRegistryStorage.target);
  console.log("IdentityRegistry:", identityRegistry.target);
  console.log("Compliance:", compliance.target);
  console.log("Token:", token.target);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
