require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const adapterAddress =
    process.env.ADAPTER_ADDRESS || "0x0fa83E143678073Bd91AeFD10dBE926b4E095Ae1";

  const adapter = await hre.ethers.getContractAt(
    "RWAOracleAdapter",
    adapterAddress
  );

  const quote = await adapter.latestQuote();
  console.log("price:", quote.price.toString());
  console.log("decimals:", quote.decimals);
  console.log("publishTime:", new Date(Number(quote.publishTime) * 1000));

  const tokenAmount = hre.ethers.parseUnits("10", 6);
  const [, tokenValueUSD] = await adapter.quoteValue(tokenAmount);
  console.log("token value USD (1e18):", tokenValueUSD.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
