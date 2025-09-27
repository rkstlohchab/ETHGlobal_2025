// deploy-property-offering.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const {
    PROPERTY_TOKEN_ADDRESS,
    PROPERTY_PRICE_PER_TOKEN_WEI,
    PROPERTY_TARGET_RAISE_WEI,
  } = process.env;

  if (!PROPERTY_TOKEN_ADDRESS || !PROPERTY_PRICE_PER_TOKEN_WEI || !PROPERTY_TARGET_RAISE_WEI) {
    throw new Error("Missing PROPERTY_TOKEN_ADDRESS, PROPERTY_PRICE_PER_TOKEN_WEI or PROPERTY_TARGET_RAISE_WEI in .env");
  }

  const [seller] = await hre.ethers.getSigners();
  console.log("Deploying offering as:", seller.address);

  const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

  const PropertyOffering = await hre.ethers.getContractFactory("PropertyOffering");
  const offering = await PropertyOffering.deploy(
    PROPERTY_TOKEN_ADDRESS,
    seller.address,
    PROPERTY_PRICE_PER_TOKEN_WEI,
    PROPERTY_TARGET_RAISE_WEI,
    deadline
  );
  await offering.waitForDeployment();

  console.log("PropertyOffering deployed:", offering.target);
  console.log("Remember to transfer inventory tokens and optionally deposit ETH liquidity.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

