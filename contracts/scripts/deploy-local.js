const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy local SimplePythMock
  const Mock = await hre.ethers.getContractFactory("SimplePythMock");
  const mock = await Mock.deploy();
  console.log("Mock Pyth deployed:", mock.target); // v6 uses .target for address

  // Choose a bytes32 priceId for your property
  const priceId = hre.ethers.encodeBytes32String("PROP-UNIT-1");

  // Deploy token
  const Token = await hre.ethers.getContractFactory("PropertyTokenLocal");
  const token = await Token.deploy(
    "PropertyUnit1",
    "RWA1",
    mock.target,
    priceId
  );
  console.log("Property token deployed:", token.target);

  // Whitelist deployer and mint
  await token.addWhitelist(deployer.address);
  await token.mint(deployer.address, hre.ethers.parseUnits("1000", 18));
  console.log("Minted 1000 tokens to deployer.");

  // Set a mock price
  const now = Math.floor(Date.now() / 1000);
  await mock.setPrice(priceId, 100000, 10, -2, now);
  console.log("Set mock price.");

  // Read back price
  const [price, conf] = await token.getLatestPrice();
  console.log(
    "Latest price:",
    price.toString(),
    "confidence:",
    conf.toString()
  );

  console.log("\n---\nCopy these to your frontend config:");
  console.log("TOKEN_ADDRESS=", token.target);
  console.log("PYTH_MOCK_ADDRESS=", mock.target);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
