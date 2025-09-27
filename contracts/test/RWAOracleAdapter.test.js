const { expect } = require("chai");
const { ethers } = require("hardhat");

const PRICE_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

describe("RWAOracleAdapter", function () {
  async function deployFixture() {
    const [deployer] = await ethers.getSigners();

    const MockPyth = await ethers.getContractFactory("MockPyth");
    const mockPyth = await MockPyth.deploy(3600, ethers.parseEther("0.01"));
    await mockPyth.waitForDeployment();

    const block = await ethers.provider.getBlock('latest');
    const currentTime = block.timestamp;
    await mockPyth.pushPrice(
      PRICE_ID,
      2000n * 10n ** 8n,
      -8,
      currentTime
    );

    const PythPriceConsumer = await ethers.getContractFactory("PythPriceConsumer");
    const consumer = await PythPriceConsumer.deploy(
      await mockPyth.getAddress(),
      PRICE_ID,
      600
    );
    await consumer.waitForDeployment();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test Token", "TEST", 6);
    await token.waitForDeployment();
    await token.mint(deployer.address, ethers.parseUnits("1000", 6));

    const RWAOracleAdapter = await ethers.getContractFactory("RWAOracleAdapter");
    const adapter = await RWAOracleAdapter.deploy(
      await token.getAddress(),
      await consumer.getAddress()
    );
    await adapter.waitForDeployment();

    return { mockPyth, consumer, token, adapter, deployer };
  }

  it("returns latest quote", async function () {
    const { adapter } = await deployFixture();
    const quote = await adapter.latestQuote();
    expect(quote.price).to.equal(ethers.parseUnits("2000", 18));
    expect(quote.decimals).to.equal(18);
    expect(quote.publishTime).to.be.gt(0);
  });

  it("values token amount using price", async function () {
    const { adapter } = await deployFixture();
    const tokenAmount = ethers.parseUnits("10", 6);
    const [, tokenValueUSD] = await adapter.quoteValue(tokenAmount);
    expect(tokenValueUSD).to.equal(ethers.parseUnits("20000", 18));
  });

  it("allows owner to update consumer", async function () {
    const { adapter, consumer } = await deployFixture();
    await adapter.setPriceConsumer(await consumer.getAddress());
    expect(await adapter.priceConsumer()).to.equal(await consumer.getAddress());
  });
});

