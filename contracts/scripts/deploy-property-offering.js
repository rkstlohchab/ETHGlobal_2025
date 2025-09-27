// deploy-property-offering.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const {
    PROPERTY_TOKEN_ADDRESS,
    PROPERTY_PRICE_PER_TOKEN_WEI,
  } = process.env;

  if (!PROPERTY_TOKEN_ADDRESS || !PROPERTY_PRICE_PER_TOKEN_WEI) {
    throw new Error("Missing PROPERTY_TOKEN_ADDRESS or PROPERTY_PRICE_PER_TOKEN_WEI in .env");
  }

  const [seller] = await hre.ethers.getSigners();
  console.log("Deploying offering as:", seller.address);

  const PropertyOffering = await hre.ethers.getContractFactory("PropertyOffering");
  const offering = await PropertyOffering.deploy(
    PROPERTY_TOKEN_ADDRESS,
    seller.address,
    PROPERTY_PRICE_PER_TOKEN_WEI
  );
  await offering.waitForDeployment();

  console.log("PropertyOffering deployed:", offering.target);
  console.log("Remember to transfer inventory tokens and optionally deposit ETH liquidity.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

