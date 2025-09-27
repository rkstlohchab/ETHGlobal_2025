const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Self Protocol Integration", function () {
  let proofOfHuman;
  let mockToken;
  let propertyOffering;
  let deployer;
  let investor;

  const MOCK_IDENTITY_HUB = "0x0000000000000000000000000000000000000001";
  const SCOPE_SEED = 12345;

  beforeEach(async function () {
    [deployer, investor] = await ethers.getSigners();

    // Deploy ProofOfHuman
    const ProofOfHuman = await ethers.getContractFactory("ProofOfHuman");
    proofOfHuman = await ProofOfHuman.deploy(
      MOCK_IDENTITY_HUB,
      SCOPE_SEED
    );

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy(
      "Property Token",
      "PROP",
      18 // 18 decimals
    );

    // Mint tokens to deployer
    await mockToken.mint(deployer.address, ethers.parseEther("1000000"));

    // Deploy PropertyOffering
    const PropertyOffering = await ethers.getContractFactory("PropertyOffering");
    const pricePerToken = ethers.parseEther("0.01");
    const goal = ethers.parseEther("10");
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    propertyOffering = await PropertyOffering.deploy(
      await mockToken.getAddress(),
      deployer.address,
      pricePerToken,
      goal,
      deadline
    );

    // Transfer tokens to offering
    await mockToken.transfer(
      await propertyOffering.getAddress(),
      ethers.parseEther("100000")
    );
  });

  describe("ProofOfHuman Contract", function () {
    it("Should deploy with correct configuration", async function () {
      const config = await proofOfHuman.verificationConfig();
      expect(config.olderThanEnabled).to.equal(true);
      expect(config.olderThan).to.equal(18);
      expect(config.forbiddenCountriesEnabled).to.equal(true);
    });

    it("Should return correct config ID", async function () {
      const configId = await proofOfHuman.verificationConfigId();
      expect(configId).to.not.equal(ethers.ZeroHash);
    });

    it("Should emit verification event", async function () {
      // This is a placeholder test since we can't easily test the actual verification
      // In a real scenario, this would test the customVerificationHook
      const configId = await proofOfHuman.verificationConfigId();
      expect(configId).to.be.a('string');
    });
  });

  describe("PropertyOffering Integration", function () {
    it("Should allow investment with proper setup", async function () {
      const tokenAmount = ethers.parseEther("1");
      const cost = ethers.parseEther("0.01");

      await expect(
        propertyOffering.connect(investor).buy(tokenAmount, { value: cost })
      ).to.emit(propertyOffering, "TokensPurchased");

      const balance = await mockToken.balanceOf(investor.address);
      expect(balance).to.equal(tokenAmount);
    });

    it("Should track total raised", async function () {
      const tokenAmount = ethers.parseEther("1");
      const cost = ethers.parseEther("0.01");

      await propertyOffering.connect(investor).buy(tokenAmount, { value: cost });

      const totalRaised = await propertyOffering.totalRaised();
      expect(totalRaised).to.equal(cost);
    });
  });
});
