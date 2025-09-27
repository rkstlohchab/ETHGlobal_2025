// deploy-pyth-consumer.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const {
    PYTH_CONTRACT_ADDRESS,
    PRICE_ID,
    TOKEN_ADDRESS,
  } = process.env;

  if (!PYTH_CONTRACT_ADDRESS || !PRICE_ID) {
    throw new Error("Missing PYTH_CONTRACT_ADDRESS or PRICE_ID in .env");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const PythPriceConsumer = await hre.ethers.getContractFactory("PythPriceConsumer");
  const consumer = await PythPriceConsumer.deploy(
    PYTH_CONTRACT_ADDRESS,
    PRICE_ID,
    600 // default max staleness 10 minutes
  );
  await consumer.waitForDeployment();
  console.log("PythPriceConsumer deployed:", consumer.target);

  if (TOKEN_ADDRESS) {
    const RWAOracleAdapter = await hre.ethers.getContractFactory("RWAOracleAdapter");
    const adapter = await RWAOracleAdapter.deploy(TOKEN_ADDRESS, consumer.target);
    await adapter.waitForDeployment();
    console.log("RWAOracleAdapter deployed:", adapter.target);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

