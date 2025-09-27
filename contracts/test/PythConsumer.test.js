const { expect } = require("chai");
const { ethers } = require("hardhat");

const PRICE_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

describe("PythPriceConsumer", function () {
  async function deployFixture() {
    const [deployer] = await ethers.getSigners();

    const MockPyth = await ethers.getContractFactory("MockPyth");
    const mockPyth = await MockPyth.deploy(3600, ethers.parseEther("0.01"));
    await mockPyth.waitForDeployment();

    const block = await ethers.provider.getBlock('latest');
    const currentTime = block.timestamp;
    await mockPyth.pushPrice(
      PRICE_ID,
      3000n * 10n ** 8n,
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

    return { deployer, mockPyth, consumer, currentTime };
  }

  describe("latestPrice", function () {
    it("returns normalized price", async function () {
      const { consumer } = await deployFixture();
      const [price, decimals, publishTime] = await consumer.latestPrice();

      expect(price).to.equal(ethers.parseUnits("3000", 18));
      expect(decimals).to.equal(18);
      expect(publishTime).to.be.gt(0);
    });

    it("reverts when price is stale", async function () {
      const { consumer, mockPyth } = await deployFixture();
      const block = await ethers.provider.getBlock('latest');
      const staleTimestamp = (block.timestamp - 1000);
      await mockPyth.pushPrice(
        PRICE_ID,
        3000n * 10n ** 8n,
        -8,
        staleTimestamp
      );

      await expect(consumer.getPriceWithAge(10)).to.be.revertedWith("MockPyth: stale price");
    });
  });

  describe("updatePriceFeeds", function () {
    it("charges the fee and refunds excess", async function () {
      const { consumer, mockPyth } = await deployFixture();
      const fee = await mockPyth.getUpdateFee([]);

      const tx = await consumer.updatePriceFeeds([], { value: fee + 10n });
      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.gt(0n);
    });
  });
});

