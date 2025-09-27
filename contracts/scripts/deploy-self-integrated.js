const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Self Protocol integrated contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Self Protocol configuration
  // For testing, we'll use a mock address. In production, use the actual Self Identity Hub V2 address
  const SELF_IDENTITY_HUB_V2_ADDRESS = "0x0000000000000000000000000000000000000001"; // Mock address for testing
  const SCOPE_SEED = 12345; // Your unique scope seed

  try {
    // 1. Deploy ProofOfHuman contract
    console.log("\n📋 Deploying ProofOfHuman contract...");
    const ProofOfHuman = await ethers.getContractFactory("ProofOfHuman");
    const proofOfHuman = await ProofOfHuman.deploy(
      SELF_IDENTITY_HUB_V2_ADDRESS,
      SCOPE_SEED
    );
    await proofOfHuman.waitForDeployment();
    const pohAddress = await proofOfHuman.getAddress();
    console.log("✅ ProofOfHuman deployed to:", pohAddress);

    // 2. Deploy a mock ERC20 token for testing
    console.log("\n🪙 Deploying MockERC20 token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy(
      "Property Token",
      "PROP",
      18 // 18 decimals
    );
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    console.log("✅ MockERC20 deployed to:", tokenAddress);

    // 3. Mint initial tokens to deployer
    console.log("\n🪙 Minting initial tokens...");
    await mockToken.mint(deployer.address, ethers.parseEther("1000000")); // 1M tokens
    console.log("✅ Minted 1,000,000 tokens to deployer");

    // 4. Deploy PropertyOffering contract
    console.log("\n🏠 Deploying PropertyOffering contract...");
    const PropertyOffering = await ethers.getContractFactory("PropertyOffering");
    const pricePerToken = ethers.parseEther("0.01"); // 0.01 ETH per token
    const goal = ethers.parseEther("10"); // 10 ETH goal
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
    
    const propertyOffering = await PropertyOffering.deploy(
      tokenAddress,
      deployer.address, // seller
      pricePerToken,
      goal,
      deadline
    );
    await propertyOffering.waitForDeployment();
    const offeringAddress = await propertyOffering.getAddress();
    console.log("✅ PropertyOffering deployed to:", offeringAddress);

    // 5. Transfer tokens to the offering contract
    console.log("\n📤 Transferring tokens to PropertyOffering...");
    const transferAmount = ethers.parseEther("100000"); // 100k tokens
    await mockToken.transfer(offeringAddress, transferAmount);
    console.log("✅ Transferred", ethers.formatEther(transferAmount), "tokens to offering contract");

    // 6. Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const offeringBalance = await mockToken.balanceOf(offeringAddress);
    const offeringPrice = await propertyOffering.pricePerToken();
    const offeringGoal = await propertyOffering.goal();
    const offeringDeadline = await propertyOffering.deadline();

    console.log("Offering token balance:", ethers.formatEther(offeringBalance));
    console.log("Price per token:", ethers.formatEther(offeringPrice), "ETH");
    console.log("Fundraising goal:", ethers.formatEther(offeringGoal), "ETH");
    console.log("Deadline:", new Date(Number(offeringDeadline) * 1000).toLocaleString());

    // 7. Output deployment summary
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("=====================");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Deployer:", deployer.address);
    console.log();
    console.log("📄 Contract Addresses:");
    console.log("ProofOfHuman:", pohAddress);
    console.log("MockERC20 Token:", tokenAddress);
    console.log("PropertyOffering:", offeringAddress);
    console.log();
    console.log("⚙️  Configuration:");
    console.log("Self Identity Hub V2:", SELF_IDENTITY_HUB_V2_ADDRESS);
    console.log("Scope Seed:", SCOPE_SEED);
    console.log("Price per Token:", ethers.formatEther(pricePerToken), "ETH");
    console.log("Fundraising Goal:", ethers.formatEther(offeringGoal), "ETH");
    console.log("Deadline:", new Date(Number(offeringDeadline) * 1000).toLocaleString());
    
    // 8. Save deployment info
    const deploymentInfo = {
      network: (await ethers.provider.getNetwork()).name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        proofOfHuman: pohAddress,
        mockToken: tokenAddress,
        propertyOffering: offeringAddress,
      },
      configuration: {
        selfIdentityHubV2: SELF_IDENTITY_HUB_V2_ADDRESS,
        scopeSeed: SCOPE_SEED,
        pricePerToken: pricePerToken.toString(),
        goal: offeringGoal.toString(),
        deadline: offeringDeadline.toString(),
      },
    };

    const fs = require('fs');
    fs.writeFileSync(
      './deployment-info.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n💾 Deployment info saved to deployment-info.json");

    console.log("\n✅ Deployment completed successfully!");
    console.log("\n🔗 Next steps:");
    console.log("1. Update frontend .env with contract addresses");
    console.log("2. Verify contracts on Etherscan (if on mainnet/testnet)");
    console.log("3. Test Self Protocol verification flow");
    console.log("4. Configure Self Protocol with actual Identity Hub V2 address");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
